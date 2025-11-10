const socket = io("https://tisha-oce7.onrender.com"); // 🔗 তোমার সার্ভার লিংক এখানে দাও

const localVideo = document.getElementById("localVideo");
const remoteVideo = document.getElementById("remoteVideo");
const startBtn = document.getElementById("startBtn");

let localStream;
let peerConnection;
const config = {
  iceServers: [{ urls: "stun:stun.l.google.com:19302" }]
};

startBtn.onclick = async () => {
  localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
  localVideo.srcObject = localStream;

  peerConnection = new RTCPeerConnection(config);
  localStream.getTracks().forEach(track => peerConnection.addTrack(track, localStream));

  peerConnection.ontrack = (event) => {
    remoteVideo.srcObject = event.streams[0];
  };

  peerConnection.onicecandidate = (event) => {
    if (event.candidate) {
      socket.emit("candidate", event.candidate);
    }
  };

  socket.emit("ready");
};

socket.on("offer", async (offer) => {
  peerConnection = new RTCPeerConnection(config);
  peerConnection.ontrack = (event) => {
    remoteVideo.srcObject = event.streams[0];
  };
  localStream.getTracks().forEach(track => peerConnection.addTrack(track, localStream));
  await peerConnection.setRemoteDescription(offer);
  const answer = await peerConnection.createAnswer();
  await peerConnection.setLocalDescription(answer);
  socket.emit("answer", answer);
});

socket.on("answer", async (answer) => {
  await peerConnection.setRemoteDescription(answer);
});

socket.on("candidate", async (candidate) => {
  try {
    await peerConnection.addIceCandidate(candidate);
  } catch (err) {
    console.error(err);
  }
});
