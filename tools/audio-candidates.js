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
      {"file":"take11_A_Place_Left_Behind.ogg","metrics":{"duration":177.162,"isSfx":false,"containerRate":48000,"channels":2,"duplicated":false,"peak":0.074,"clipped":8,"level":-15.03,"headFade":0.1,"tailFade":1.75,"build":0.574,"spread":2.167,"seamStep":27.708,"seamJump":0,"bpm":[92,86,96],"air":-43.898,"mid":-8.698,"bands":{"low":0.912,"lowMid":1.195,"mid":-8.698,"high":-28.439,"air":-43.898},"midShare":0.05}},
      {"file":"take12_Slow_Breathing_Walls.ogg","metrics":{"duration":178.913,"isSfx":false,"containerRate":48000,"channels":2,"duplicated":false,"peak":-0.186,"clipped":0,"level":-14.558,"headFade":0.05,"tailFade":2.95,"build":-0.205,"spread":2.87,"seamStep":40.578,"seamJump":0,"bpm":[96,78,81],"air":-42.613,"mid":-8.812,"bands":{"low":1.307,"lowMid":0.567,"mid":-8.812,"high":-28.411,"air":-42.613},"midShare":0.05}},
      {"file":"take19_Just_After_They_Left.ogg","metrics":{"duration":175.464,"isSfx":false,"containerRate":48000,"channels":2,"duplicated":false,"peak":0.227,"clipped":10,"level":-14.798,"headFade":0.05,"tailFade":2.8,"build":1.054,"spread":3.01,"seamStep":39.408,"seamJump":0,"bpm":[78,81,133],"air":-44.755,"mid":-10.469,"bands":{"low":0.944,"lowMid":0.583,"mid":-10.469,"high":-29.79,"air":-44.755},"midShare":0.036}},
    ],
  },
  {
    cue: 'bgm-inferno',
    base: '../client/src/assets/audio/candidates/inferno/',
    takes: [
      {"file":"take13_Midnight_Foundry.ogg","metrics":{"duration":138.867,"isSfx":false,"containerRate":48000,"channels":2,"duplicated":false,"peak":-0.014,"clipped":0,"level":-14.677,"headFade":0.05,"tailFade":1.55,"build":0.065,"spread":0.334,"seamStep":51.282,"seamJump":0,"bpm":[83,86,85],"air":-20.991,"mid":-13.954,"bands":{"low":0.937,"lowMid":-5.359,"mid":-13.954,"high":-16.155,"air":-20.991},"midShare":0.025}},
      {"file":"take14_After_the_Prayer.ogg","metrics":{"duration":177.528,"isSfx":false,"containerRate":48000,"channels":2,"duplicated":false,"peak":-0.09,"clipped":0,"level":-15.44,"headFade":0.1,"tailFade":1.55,"build":0.475,"spread":1.35,"seamStep":32.73,"seamJump":0,"bpm":[96,72,103],"air":-38.602,"mid":-7.898,"bands":{"low":0.851,"lowMid":1.488,"mid":-7.898,"high":-25.049,"air":-38.602},"midShare":0.058}},
      {"file":"take18_Cinder_and_Lead.ogg","metrics":{"duration":139.938,"isSfx":false,"containerRate":48000,"channels":2,"duplicated":false,"peak":0.442,"clipped":10,"level":-14.881,"headFade":0.05,"tailFade":2.65,"build":0.164,"spread":0.529,"seamStep":45.589,"seamJump":0,"bpm":[74,76,89],"air":-17.515,"mid":-9.322,"bands":{"low":1.588,"lowMid":-3.807,"mid":-9.322,"high":-11.844,"air":-17.515},"midShare":0.057}},
      {"file":"take20_Ten_Ton_Loom.ogg","metrics":{"duration":181.525,"isSfx":false,"containerRate":48000,"channels":2,"duplicated":false,"peak":0.536,"clipped":20,"level":-15.015,"headFade":0.05,"tailFade":1.4,"build":0.443,"spread":1.472,"seamStep":46.869,"seamJump":0,"bpm":[74,76,89],"air":-15.971,"mid":-5.228,"bands":{"low":1.068,"lowMid":-4.241,"mid":-5.228,"high":-9.217,"air":-15.971},"midShare":0.143}},
      {"file":"take22_Concrete_Teeth.ogg","metrics":{"duration":182.387,"isSfx":false,"containerRate":48000,"channels":2,"duplicated":false,"peak":0.424,"clipped":11,"level":-14.802,"headFade":0.05,"tailFade":2.25,"build":0.403,"spread":0.822,"seamStep":47.696,"seamJump":0,"bpm":[86,83,136],"air":-16.487,"mid":-8.068,"bands":{"low":1.197,"lowMid":-4.796,"mid":-8.068,"high":-11.742,"air":-16.487},"midShare":0.082}},
    ],
  },
  {
    cue: 'bgm-return',
    base: '../client/src/assets/audio/candidates/return/',
    takes: [
      {"file":"take15_Cathedral_of_Glass.ogg","metrics":{"duration":176.3,"isSfx":false,"containerRate":48000,"channels":2,"duplicated":false,"peak":0.099,"clipped":1,"level":-14.753,"headFade":2.95,"tailFade":2.7,"build":1.095,"spread":3.11,"seamStep":6.346,"seamJump":0,"bpm":[81,78,83],"air":-30.101,"mid":-1.329,"bands":{"low":-2.232,"lowMid":2.275,"mid":-1.329,"high":-14.341,"air":-30.101},"midShare":0.241}},
      {"file":"take16_Suspended_in_White.ogg","metrics":{"duration":174.341,"isSfx":false,"containerRate":48000,"channels":2,"duplicated":false,"peak":0.109,"clipped":4,"level":-15.687,"headFade":3.15,"tailFade":3.25,"build":4.112,"spread":6.696,"seamStep":7.03,"seamJump":0,"bpm":[81,78,83],"air":-30.622,"mid":-1.378,"bands":{"low":-2.779,"lowMid":2.545,"mid":-1.378,"high":-16.159,"air":-30.622},"midShare":0.237}},
      {"file":"take17_Unsettled_Light.ogg","metrics":{"duration":175.099,"isSfx":false,"containerRate":48000,"channels":2,"duplicated":false,"peak":-0.188,"clipped":0,"level":-15.59,"headFade":2.3,"tailFade":3.05,"build":0.522,"spread":1.713,"seamStep":11.309,"seamJump":0,"bpm":[81,78,129],"air":-29.665,"mid":-2.003,"bands":{"low":-2.053,"lowMid":2.372,"mid":-2.003,"high":-14.445,"air":-29.665},"midShare":0.209}},
      {"file":"take21_Vigil_in_Concrete.ogg","metrics":{"duration":175.099,"isSfx":false,"containerRate":48000,"channels":2,"duplicated":false,"peak":0.727,"clipped":290,"level":-15.253,"headFade":0.05,"tailFade":1.7,"build":2.129,"spread":5.351,"seamStep":35.675,"seamJump":0,"bpm":[81,96,86],"air":-38.325,"mid":-7.223,"bands":{"low":0.272,"lowMid":1.9,"mid":-7.223,"high":-24.966,"air":-38.325},"midShare":0.068}},
      {"file":"take23_Smiling_Through_Glass.ogg","metrics":{"duration":175.726,"isSfx":false,"containerRate":48000,"channels":2,"duplicated":false,"peak":0.693,"clipped":18,"level":-15.636,"headFade":0.1,"tailFade":1.7,"build":2.238,"spread":6.095,"seamStep":33.519,"seamJump":0,"bpm":[81,78,129],"air":-25.444,"mid":-0.853,"bands":{"low":-2.933,"lowMid":2.011,"mid":-0.853,"high":-12.203,"air":-25.444},"midShare":0.275}},
    ],
  },
];
