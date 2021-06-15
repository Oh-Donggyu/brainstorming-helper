const kafka = require("kafka-node");
const CustomError = require("../errors");

const PRODUCER_OPTIONS = {

};
const CUSTOMER_OPTIONS = {

};
const CONSUMER_TOPIC = "tfidfResults"; // TODO: 토픽명 확인
let IS_PRODUCER_READY = 0;

const keywordResMap = new Map();

const client = new kafka.KafkaClient({ kafkaHost: "192.168.56.19:9092" });
const stuckedMessages = [];

// init producer
const producer = new kafka.Producer(client);
producer.on("ready", () => {
    IS_PRODUCER_READY = 1;
    sendStuckedMessages();
});
producer.on("error", (error) => {
    throw new CustomError("Kafka Producer Error", 500, error);
});

// init consumer
const consumer = new kafka.Consumer(client, [
    { topic: CONSUMER_TOPIC, partition: 0 }
]);
consumer.on("message", (message) => {
	console.log("message receive!");
	console.log(message);
    const word = message.key;
    const result = message.value;
    const resArr = keywordResMap.get(word);
    if(resArr) {
        console.log(resArr);
		for(const res of resArr) {
            res.status(201).json({ word, result });
        }
        keywordResMap.delete(word);
    } else {
        throw new CustomError("Cannot find res object", 500);  
    }
});
consumer.on("error", (error) => {
    throw new CustomError("Kafka Consumer Error", 500, error);
})

function sendStuckedMessages() {
    for(const message of stuckedMessages) {
        console.log(message);
        const kafkaMessage = [{ topic: message.topic, messages: message.messages }];
        producer.send(kafkaMessage, (error, data) => {
            if(error) {
                throw new CustomError("Kafka producer send message error", 500, error);
            } else {
                console.log("send message!");
                console.log(data);
            }
        });
    }
}

class KafkaDriver {
    static sendMessage(topic, message) {        
        if(IS_PRODUCER_READY) {
            const keyedMessage = new kafka.KeyedMessage(message.key, message.value)
            const kafkaMessage = [{ topic, messages: keyedMessage }];
            producer.send(kafkaMessage, (error, data) => {
                if(error) {
                    throw new CustomError("Kafka producer send message error", 500, error);
                } else {
                    console.log("send message!");
                    console.log(data);
                }
            });
        } else {
            console.log("producer is not ready");
            stuckedMessages.push({ topic, messages });
        }
    }

    static async createTopic(topic) {
        // To check topic already exists
        // If exist, do not create topic
        try {
            await new Promise((resolve, reject) => {
                client.loadMetadataForTopics([topic], (error, result) => {
                    const topics = Object.keys(result[1].metadata);
                    if(topics.includes(topic))
                        reject(result);
                    else
                        resolve();
                });
            });
        } catch(error) {
            return;
        }

        // TODO: 실제 실행 환경에서는 partitions, replicationFactor 모두 3으로 수정 필요
        const topicsToCreate = [
            {
                topic,
                partitions: 1,
                replicationFactor: 1,
            },
        ];
        return new Promise((resolve, reject) => {
            client.createTopics(topicsToCreate, (error, result) => {
                if(result) {
                    reject(result);
                } else {
                    console.log(`[Kafka] Create topic '${topic}' Successfully`);
                    resolve();
                }
            });
        });
    }
}

module.exports = { 
    KafkaDriver,
    keywordResMap,
};
