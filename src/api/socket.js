import SockJS from "sockjs-client";
import Stomp from "stompjs";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8080/api";
const WS_URL = API_URL.replace("/api", "");

let stompClient = null;
let socket = null;

export const connectSocket = (onMessage, onError) => {
  if (stompClient && stompClient.connected) {
    return; // Already connected
  }

  socket = new SockJS(`${WS_URL}/ws`);
  stompClient = Stomp.over(socket);

  stompClient.connect(
    {},
    () => {
      console.log("WebSocket connected");
      stompClient.subscribe("/topic/orders", (message) => {
        try {
          const orderUpdate = JSON.parse(message.body);
          onMessage(orderUpdate);
        } catch (error) {
          console.error("Error parsing WebSocket message:", error);
        }
      });
    },
    (error) => {
      console.error("WebSocket connection error:", error);
      if (onError) onError(error);
    }
  );
};

export const disconnectSocket = () => {
  if (stompClient && stompClient.connected) {
    stompClient.disconnect();
  }
  if (socket) {
    socket.close();
  }
  stompClient = null;
  socket = null;
};

export const sendOrderUpdate = (order) => {
  if (stompClient && stompClient.connected) {
    stompClient.send("/app/order-updates", {}, JSON.stringify(order));
  } else {
    console.warn("WebSocket not connected. Cannot send order update.");
  }
};

