// 후보 음원의 측정 결과. tools/audio-check.html이 이 파일을 읽어
// 열자마자 목록을 보여 준다. 같은 파일이면 결과가 늘 같으므로
// 열 때마다 다시 분석하지 않는다.
//
// 후보를 추가하거나 교체한 뒤에는 tools/bake-candidates.mjs를 돌려
// 이 파일을 다시 만든다. 손으로 고치지 않는다.

window.AUDIO_CANDIDATES = [
  {
    cue: 'bgm-underground',
    base: '../client/src/assets/audio/candidates/underground/',
    takes: [
      {"file":"take11_A_Place_Left_Behind.ogg","metrics":{"duration":177.162,"isSfx":false,"containerRate":48000,"channels":2,"duplicated":false,"peak":0.074,"clipped":9,"level":-15.03,"headFade":0.1,"tailFade":1.75,"build":0.574,"spread":2.167,"seamStep":27.708,"seamJump":0,"bpm":[100,78,128],"air":-43.528,"mid":-8.689,"bands":{"low":0.912,"lowMid":1.195,"mid":-8.689,"high":-28.358,"air":-43.528},"midShare":0.05}},
      {"file":"take12_Slow_Breathing_Walls.ogg","metrics":{"duration":178.913,"isSfx":false,"containerRate":48000,"channels":2,"duplicated":false,"peak":-0.186,"clipped":0,"level":-14.558,"headFade":0.05,"tailFade":2.95,"build":-0.204,"spread":2.87,"seamStep":40.578,"seamJump":0,"bpm":[97,78,83],"air":-42.246,"mid":-8.802,"bands":{"low":1.307,"lowMid":0.568,"mid":-8.802,"high":-28.333,"air":-42.246},"midShare":0.05}},
      {"file":"take19_Just_After_They_Left.ogg","metrics":{"duration":175.465,"isSfx":false,"containerRate":48000,"channels":2,"duplicated":false,"peak":0.229,"clipped":11,"level":-14.797,"headFade":0.05,"tailFade":2.8,"build":1.054,"spread":3.01,"seamStep":39.408,"seamJump":0,"bpm":[78,80,83],"air":-44.389,"mid":-10.459,"bands":{"low":0.944,"lowMid":0.584,"mid":-10.459,"high":-29.708,"air":-44.389},"midShare":0.036}},
    ],
  },
  {
    cue: 'bgm-return',
    base: '../client/src/assets/audio/candidates/return/',
    takes: [
      {"file":"take15_Cathedral_of_Glass.ogg","metrics":{"duration":176.3,"isSfx":false,"containerRate":48000,"channels":2,"duplicated":false,"peak":0.072,"clipped":2,"level":-14.753,"headFade":2.95,"tailFade":2.7,"build":1.095,"spread":3.11,"seamStep":6.346,"seamJump":0,"bpm":[80,78,83],"air":-29.736,"mid":-1.319,"bands":{"low":-2.232,"lowMid":2.276,"mid":-1.319,"high":-14.27,"air":-29.736},"midShare":0.241}},
      {"file":"take16_Suspended_in_White.ogg","metrics":{"duration":174.341,"isSfx":false,"containerRate":48000,"channels":2,"duplicated":false,"peak":0.126,"clipped":4,"level":-15.687,"headFade":3.15,"tailFade":3.25,"build":4.112,"spread":6.696,"seamStep":7.03,"seamJump":0,"bpm":[80,78,97],"air":-30.271,"mid":-1.369,"bands":{"low":-2.779,"lowMid":2.545,"mid":-1.369,"high":-16.09,"air":-30.271},"midShare":0.237}},
      {"file":"take17_Unsettled_Light.ogg","metrics":{"duration":175.099,"isSfx":false,"containerRate":48000,"channels":2,"duplicated":false,"peak":-0.181,"clipped":0,"level":-15.59,"headFade":2.3,"tailFade":3.05,"build":0.522,"spread":1.713,"seamStep":11.308,"seamJump":0,"bpm":[80,78,100],"air":-29.292,"mid":-1.993,"bands":{"low":-2.053,"lowMid":2.373,"mid":-1.993,"high":-14.374,"air":-29.292},"midShare":0.209}},
      {"file":"take21_Vigil_in_Concrete.ogg","metrics":{"duration":175.099,"isSfx":false,"containerRate":48000,"channels":2,"duplicated":false,"peak":0.727,"clipped":314,"level":-15.252,"headFade":0.05,"tailFade":1.7,"build":2.129,"spread":5.351,"seamStep":35.676,"seamJump":0,"bpm":[80,97,91],"air":-37.968,"mid":-7.213,"bands":{"low":0.273,"lowMid":1.901,"mid":-7.213,"high":-24.889,"air":-37.968},"midShare":0.068}},
      {"file":"take23_Smiling_Through_Glass.ogg","metrics":{"duration":175.726,"isSfx":false,"containerRate":48000,"channels":2,"duplicated":false,"peak":0.713,"clipped":18,"level":-15.636,"headFade":0.1,"tailFade":1.7,"build":2.238,"spread":6.095,"seamStep":33.519,"seamJump":0,"bpm":[80,78,128],"air":-25.078,"mid":-0.843,"bands":{"low":-2.933,"lowMid":2.012,"mid":-0.843,"high":-12.138,"air":-25.078},"midShare":0.276}},
    ],
  },
];
