import pyspark
from pyspark.ml.feature import HashingTF as MLHashingTF
from pyspark.ml.feature import IDF as MLIDF

from pyspark.streaming.kafka import KafkaUtils
from pyspark import SparkContext
from pyspark.streaming import StreamingContext

from math import log
from scipy import spatial
import pandas as pd

from functools import cmp_to_key

from kafka import KafkaProducer

DOCUMENT_COUNT = 2
TOP_N_WORDS = 5
PRODUCER_TOPIC = "tfIdfResults"
CONSUMER_TOPIC = "crawledResults"
BROKER_LIST = "192.168.56.19:9092"

producer = KafkaProducer(bootstrap_servers="192.168.56.19:9092", key_serializer=str.encode, value_serializer=str.encode)

sc = SparkContext(appName='test')
sc.setLogLevel("WARN")

ssc = StreamingContext(sc, 2)
crawledData = KafkaUtils.createDirectStream(ssc, topics=[CONSUMER_TOPIC], 
			                                        kafkaParams={"metadata.broker.list": BROKER_LIST})


# keyword_map structure
# keyword_map = {
#	keyword: {
#		documents_count: INT
#		word_count: {
#			word1: [0, 1, 2, 0 ...],
#			word2: [1, 12, 9 1, ...],
#			...
#		}
#	},
# 	...
# }

keyword_map = {}


def compare(x, y):
	if x[1] < y[1]:
		return 1
	elif x[1] > y[1]:
		return -1
	else:
		return 0

def calc_term_term_matrix(keyword):
	word_count_dic = keyword_map[keyword]["word_count"]
	document_count = keyword_map[keyword]["document_count"]
	tf_matrix = list(word_count_dic.values())
	words = list(word_count_dic.keys())
	
	keyword_idx = -1
	for idx in range(len(words)):
		if words[idx] == keyword:
			keyword_idx = idx
			break
	
	if keyword_idx == -1:
		return None
	

	df_matrix = []
	for row in tf_matrix:
		df = 0
		for freq in row:
			if freq != 0:
				df += 1

		df_matrix.append(log(document_count) / (df + 1))

	tf_idf_matrix = []
	for tf_row in tf_matrix:
		tf_idf_list = [] # tf-idf for one word - total documents
		for idx in range(document_count):
			tf_idf_list.append(tf_row[idx] * df_matrix[idx])

		tf_idf_matrix.append(tf_idf_list)

	tf_idf_dataframe = pd.DataFrame(tf_idf_matrix)
	tf_idf_trans_dataframe = tf_idf_dataframe.T

	term_term_dataframe = tf_idf_dataframe.dot(tf_idf_trans_dataframe) 

	term_term_matrix = list(term_term_dataframe.values.tolist())
	
	cosine_similarity_list = []
	keyword_vector = term_term_matrix[keyword_idx]
	for idx in range(len(words)):
		if idx == keyword_idx:
			cosine_similarity_list.append((words[idx], -1))
		else:
			word_vector = term_term_matrix[idx]
			cosine_similarity = 1 - spatial.distance.cosine(keyword_vector, word_vector)
			cosine_similarity_list.append((words[idx], cosine_similarity))

	print(cosine_similarity_list)
	cosine_similarity_list = sorted(cosine_similarity_list, key=cmp_to_key(compare))
	print(cosine_similarity_list)
	
	del(keyword_map[keyword])

	return cosine_similarity_list[0:TOP_N_WORDS]

def split_line(keyword_content):
	keyword = keyword_content[0]
	content = keyword_content[1]

	content_words = content.split(" ")

	return [(keyword, word) for word in content_words]

def count_one_word(keyword_word):
	keyword = keyword_word[0]
	word = keyword_word[1]

	return (word, (keyword, 1))


def reduceFunc(x, y):
	word = x[0]

	xval = x[1]
	yval = y[1]

	return (word, xval + yval)

def save_rdd(rdd):
	word_keyword_count_list = rdd.collect()
	if not word_keyword_count_list:
		return
	
	tmp = word_keyword_count_list[0]
	keyword = tmp[1][0]
	if keyword_map.get(keyword) is None:
		keyword_map[keyword] = {"document_count": 0, "word_count": {}}
	
	
	keyword_map[keyword]["document_count"] += 1
	document_count = keyword_map[keyword]["document_count"]

	for word_keyword_count in word_keyword_count_list:	
		word = word_keyword_count[0]
		keyword = word_keyword_count[1][0]
		count = word_keyword_count[1][1]
		
		if keyword_map[keyword]["word_count"].get(word) is None:
			keyword_map[keyword]["word_count"][word] = [count]
		else:
			keyword_map[keyword]["word_count"][word].append(count)

	for word, count_list in keyword_map[keyword]["word_count"].items():
		while(len(count_list) < document_count):
			count_list.append(0)
			

	if keyword_map[keyword]["document_count"] == DOCUMENT_COUNT:
		calc_result = calc_term_term_matrix(keyword)
		
		calc_result_str = ""
		for element in calc_result:
			calc_result_str += str(element[0])
			calc_result_str += " "
			calc_result_str += str(element[1])
			calc_result_str += " "

		producer.send(PRODUCER_TOPIC, key=keyword, value=calc_result_str)
		producer.flush()

# words = lines1.flatMap(lambda line: line.split(" "))
words = crawledData.flatMap(split_line)

words.pprint()

# pairs = words.map(lambda word:(word, 1))
pairs = words.map(count_one_word)

pairs.pprint()

# wordcounts = pairs.reduceByKey(lambda x, y: x + y)
wordCounts = pairs.reduceByKey(reduceFunc)

wordCounts.pprint()

wordCounts.foreachRDD(save_rdd)

ssc.start()
ssc.awaitTermination()
