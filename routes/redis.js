import redis from "redis";

// Redis
let redisClient;

(async () => {
  redisClient = redis.createClient();

  redisClient.on("error", (error) => console.error(`Error : ${error}`));

  await redisClient.connect();
})();

const Login = async (redisKey) => {
  try {
    const cachedResult = await redisClient.get(redisKey);
    return cachedResult;
  } catch (e) {
    console.log(e);
  }
}

const postRedis = async (key, time, content, conditions) => {
  try {
    // await redisClient.connect();
    redisClient.setEx(key, time, content, conditions);
  } catch (err) {
    throw err;
  }
  
}



export { Login, postRedis };
