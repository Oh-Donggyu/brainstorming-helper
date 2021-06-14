import findspark
findspark.init()

from pyspark import SparkContext
from pyspark.streaming import StreamingContext
from pyspark.streaming.kafka import KafkaUtils
# lines = ssc.socketTextStream("localhost", 9999)

sc = SparkContext(appname="Kafka urls read")
ssc = StreamingContext(sc, 1)

message = KafkaUtils.createDirectStream(ssc, topics=["urls"], kafkaParams={"metadata.broker.list":"localhost:9092"})
message = message.flatMap(lambda x:x.split(" "))

message.pprint()

ssc.start()
ssc.awaitTermination()