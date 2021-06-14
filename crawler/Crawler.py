#%%

from datetime import datetime
from kafka.metrics import measurable
from pyspark.streaming.kafka import KafkaUtils
from pyspark import SparkContext
from pyspark.streaming import StreamingContext
from kafka import KafkaProducer
from urllib.request import urlopen
from bs4 import BeautifulSoup
import re


sc = SparkContext(appName='crawl')
ssc = StreamingContext(sc, 5)
sc.setLogLevel("WARN")
urls = KafkaUtils.createDirectStream(ssc, topics=["urls"], 
                                    kafkaParams={"metadata.broker.list":"192.168.1.91:9092"})

def get_text(tag):
    return re.sub(r'[^\w]+',' ',tag.get_text())

def get_contents(t):

    try:
        key = t[0]
        html = urlopen(t[1])
    
        soup = BeautifulSoup(html, 'html.parser')
    
        head = soup.find_all(['h1','h2','h3'])
        content = soup.find_all('p')    

        head = ' '.join(map(get_text, head))
        content = ' '.join(map(get_text, content))

        return key, content

    except:
        pass


def func1(t):
    key = t[0]
    values = t[1].split(" ")

    return [(key, value) for value in values]

def func2(t):
    key = t[0]
    url = t[1]
    return True if 'http' in url else False

urls = urls.flatMap(lambda x: func1(x))
urls = urls.filter(lambda x: func2(x))
contents = urls.map(lambda url: get_contents(url))


producer = KafkaProducer(bootstrap_servers='192.168.1.91:9092', key_serializer=str.encode, value_serializer=str.encode)

def push_to_topics(data, topic='crawled_results'):
    
    data = data.collect()
    if not data:
        return
         
    else:        
        for t in data:
            producer.send(topic, key=t[0], value=t[1])
        producer.flush()
    

contents.foreachRDD(lambda x: push_to_topics(x))
contents.pprint()

ssc.start()
ssc.awaitTermination()
#%%
