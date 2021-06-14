from pyspark import SparkConf
from pyspark.streaming.kafka import KafkaUtils
from pyspark import SparkContext
from pyspark.streaming import StreamingContext

conf = SparkConf().setMaster("local[*]").setAppName("Test")
sc = SparkContext("local[4]", "", conf=conf)
sc.setLogLevel("WARN")
ssc = StreamingContext(sc, 5)

kafkaMessages = KafkaUtils.createDirectStream(ssc, topics=["crawledResults"], 
                                        kafkaParams={"metadata.broker.list":"192.168.56.19:9092"})



key = kafkaMessages.map(lambda msg: msg[0])
words = kafkaMessages.flatMap(lambda msg: msg[1].split(" "))



result = urls.map(lambda url: get_contents(url))

result.pprint()

ssc.start()
ssc.awaitTermination()
