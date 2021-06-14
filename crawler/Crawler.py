from pyspark.streaming.kafka import KafkaUtils
from pyspark import SparkContext
from pyspark.streaming import StreamingContext

sc = SparkContext(appName='test')
ssc = StreamingContext(sc, 5)

urls = KafkaUtils.createDirectStream(ssc, topics=["quickstart"], 
                                        kafkaParams={"metadata.broker.list":"localhost:9092"})

from urllib.request import urlopen
from nltk.tokenize import RegexpTokenizer
from bs4 import BeautifulSoup
# from nltk.tokenize import RegexpTokenizer
import time

# tokenizer = RegexpTokenizer('[\w]+')

def get_text(tag):
    return tag.get_text()

def get_contents(url):

        
    html = urlopen(url)

        
    soup = BeautifulSoup(html, 'html.parser')
    
    head = soup.find_all(['h1','h2','h3'])
    content = soup.find_all('p')    

    head = ' '.join(map(get_text, head))
    content = ' '.join(map(get_text, content))

    # head = tokenizer.tokenize(head)
    # content = tokenizer.tokenize(content)
    
    return content



def parallel_processing(urls, num_processes):

    from multiprocessing import Pool

    pool = Pool(num_processes)

    result = pool.map(get_contents, urls)
    pool.close()
    pool.join()

    return result



urls = urls.flatMap(lambda url: url[1].split(" "))
contents = urls.map(lambda url: get_contents(url))

contents.pprint()





ssc.start()
ssc.awaitTermination()