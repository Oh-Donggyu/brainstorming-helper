
from pyspark import SparkConf
from pyspark.streaming.kafka import KafkaUtils
from pyspark import SparkContext
from pyspark.streaming import StreamingContext
from kafka import KafkaProducer

producer = KafkaProducer(acks=0, bootstrap_servers=['192.168.56.19:9092'], key_serializer=str.encode, value_serializer=str.encode)

conf = SparkConf().setMaster("local[*]").setAppName("Test")
conf.set("spark.executor.heartbeatInterval", "3500s")
conf.set("spark.network.timeout", "3600s")
sc = SparkContext("local[4]", "", conf=conf)
sc.setLogLevel("WARN")
ssc = StreamingContext(sc, 5)

urls = KafkaUtils.createDirectStream(ssc, topics=["urls"], kafkaParams={"metadata.broker.list":"192.168.56.19:9092"})

key = ""

from urllib.request import urlopen
from bs4 import BeautifulSoup


def get_text(tag):
	return tag.get_text()

def get_contents(url):
	url = url[1]
	try:
		html = urlopen(url)
					               
		soup = BeautifulSoup(html, 'html.parser')
							           
		head = soup.find_all(['h1','h2','h3'])
		content = soup.find_all('p')    

		head = ' '.join(map(get_text, head))
		content = ' '.join(map(get_text, content))

		# head = tokenizer.tokenize(head)
		# content = tokenizer.tokenize(content)

		result = content
	except Exception as e:
		print(e)	
		result = ""
	finally:
		return result

def get_key(rdd):
	key = rdd[0]
	return key
	
def parse_urls(rdd):
	return rdd[1].split(" ")

def send_msg(rdd):
	values = rdd.collect()
	print("key = ", key)

	# valuie가 비어있을 경우
	if not values:
		return
	
	for value in values:
		producer.send(topic="crawledResults", key=key, value=value)
	
	producer.flush()

keys = urls.map(get_key)
keys.pprint()
urls = urls.map(parse_urls)
result = urls.map(get_contents)

# result.pprint()

result.foreachRDD(send_msg)

ssc.start()
ssc.awaitTermination()
