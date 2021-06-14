from pyspark import SparkConf
from pyspark.streaming.kafka import KafkaUtils
from pyspark import SparkContext
from pyspark.streaming import StreamingContext

conf = SparkConf().setMaster("local[*]").setAppName("Test")
conf.set("spark.executor.heartbeatInterval", "3500s")
conf.set("spark.network.timeout", "3600s")
sc = SparkContext("local[4]", "", conf=conf)
sc.setLogLevel("WARN")
ssc = StreamingContext(sc, 5)

urls = KafkaUtils.createDirectStream(ssc, topics=["urls"], 
                                        kafkaParams={"metadata.broker.list":"192.168.56.19:9092"})


from urllib.request import urlopen
from bs4 import BeautifulSoup
import re

def get_text(tag):
    return re.sub(r'[^\w]+',' ',tag.get_text())

def get_contents(url):
    try:
        html = urlopen(url)
            
        soup = BeautifulSoup(html, 'html.parser')
        
        head = soup.find_all(['h1','h2','h3'])
        content = soup.find_all('p')    

        head = ' '.join(map(get_text, head))
        content = ' '.join(map(get_text, content))

        # head = tokenizer.tokenize(head)
        # content = tokenizer.tokenize(content)

        result = head + "===" + content
    except:
        result = ""
    finally:
        return result

key = urls.map(lambda x: x[0])
urls = urls.flatMap(lambda url: url[1].split(" "))
result = urls.map(lambda url: get_contents(url))

result.pprint()

ssc.start()
ssc.awaitTermination()
