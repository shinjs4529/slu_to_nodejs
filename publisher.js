const amqp = require('amqplib/callback_api');
const uuid = require('uuid');

const robotID = "13131313";
const optionCon = { credentials: require('amqplib').credentials.plain('kist', 'kist123!') };
amqp.connect(`amqp://rabbitmq`, optionCon, (err, connection) => {
    if (err) {
        throw err;
    }
    connection.createChannel((err, channel) => {
        if (err) {
            throw err;
        }
        let queueName = "slu_main_kist";
        let input_msg = "안녕";
        let input_msg_json = {
            input : {
                asr_hyps : [
                    {
                        score : 1.0,
                        asr_hyp : input_msg
                    }
                ]
            },
            turn_index : 1,
            session_id : null
        }
        message = JSON.stringify(input_msg_json)

        //발신
        // console.log(`Auto generated queue name : ${channel.??}`);
        let corrId = uuid.v4();
        let replyQueueName = "slu-"+robotID;//Java에서는 robotID 대신에, 자동 생성되는 queue name(ex. amq.gen-****)을 사용한다
        channel.assertQueue(replyQueueName, {
            durable: false
        });
        let optionPub = {
            correlationId: corrId, 
            replyTo: replyQueueName
        };
        channel.sendToQueue(queueName, Buffer.from(message), optionPub);
        console.log(`Message : ${message}`);

        //수신
        channel.consume(replyQueueName, (msg) => {
            console.log(`--- A message Received ---`);
            if (msg.properties.correlationId === corrId){
                var receivedMessage = msg.content.toString();
                channel.ack(msg);//메세지를 받았으니 큐에서 삭제해도 좋다
                var jsonObj = JSON.parse(receivedMessage);
                analyzeResultHandler(jsonObj);
            }
        })
    })
})

const analyzeResultHandler = function(object){
    console.log(`Json : ${JSON.stringify(object)}`);
    var hyps = object.slu_hyps;
    var result_code = object.code;
    var hyp_outer;
    var hyp;
    var topic, category, intent;
    var slot_key, slot_value;//자바에선 Hasmap구조로 사용
    for (var object in hyps){
        hyp_outer = hyps[object];
        hyp = hyp_outer.slu_hyp;
        for (var object2 in hyp){
            hyp_inner = hyp[object2];
        }
    }
    if (result_code == 101) {
        topic = "none";
        category = "none";
        intent = "error";
        slot_key = "none";
        slot_value = "none";
    } else {
        topic = hyp_outer.topic;
        category = hyp_outer.category;
        intent = hyp_inner.act;
        slot_key = hyp_inner.slot;
        slot_value = hyp_inner.value;
    }
    console.log("topic: ",topic);
    console.log("category: ",category);
    console.log("intent: ",intent);
    console.log("slot_key: ",slot_key);
    console.log("slot_value: ",slot_value);
}
