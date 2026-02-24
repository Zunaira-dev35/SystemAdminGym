// src/lib/pusher.ts
import Pusher from "pusher-js";

const pusher = new Pusher("a09fb0f37a3272bb6406", {
  cluster: "mt1",
  forceTLS: true,
});

export default pusher;