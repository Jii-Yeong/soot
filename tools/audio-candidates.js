// 후보 음원의 측정 결과. tools/audio-check.html이 이 파일을 읽어
// 열자마자 목록을 보여 준다. 같은 파일이면 결과가 늘 같으므로
// 열 때마다 다시 분석하지 않는다.
//
// 새 테이크를 추가하려면 점검 도구의 "새 음원 분석하기"로 분석한 뒤
// 콘솔에 찍히는 [audio-check] manifest 내용을 아래 takes에 붙여 넣는다.

window.AUDIO_CANDIDATES = [
  {
    cue: 'bgm-city',
    base: '../client/src/assets/audio/candidates/city/',
    takes: [
      {"file":"A_Room_Without_Walls.mp3","metrics":{"duration":167.863,"isSfx":false,"containerRate":44100,"channels":2,"duplicated":false,"peak":-0.087,"clipped":0,"level":-14.836,"headFade":2.55,"tailFade":5.3,"build":1.306,"spread":2.047,"seamStep":1.902,"seamJump":0,"bpm":[88,91,120],"air":-23.657,"mid":-9.065,"bands":{"low":0.46,"lowMid":2.158,"mid":-9.065,"high":-20.279,"air":-23.657},"midShare":0.043}},
      {"file":"Atrium_at_Midday.mp3","metrics":{"duration":173.558,"isSfx":false,"containerRate":44100,"channels":2,"duplicated":false,"peak":0.016,"clipped":2,"level":-15.594,"headFade":0.05,"tailFade":2.85,"build":-0.151,"spread":0.748,"seamStep":33.425,"seamJump":0,"bpm":[91,94,88],"air":-22.88,"mid":-3.983,"bands":{"low":-0.831,"lowMid":1.209,"mid":-3.983,"high":-15.266,"air":-22.88},"midShare":0.155}},
      {"file":"Glass_and_Cedar.mp3","metrics":{"duration":172.304,"isSfx":false,"containerRate":44100,"channels":2,"duplicated":false,"peak":-0.227,"clipped":0,"level":-15.084,"headFade":0.05,"tailFade":4.8,"build":1.957,"spread":2.744,"seamStep":37.741,"seamJump":0,"bpm":[91,122,97],"air":-25.833,"mid":-8.102,"bands":{"low":0.673,"lowMid":1.086,"mid":-8.102,"high":-21.565,"air":-25.833},"midShare":0.059}},
      {"file":"Glass_in_the_Afternoon.mp3","metrics":{"duration":173.584,"isSfx":false,"containerRate":44100,"channels":2,"duplicated":false,"peak":-0.05,"clipped":0,"level":-15.159,"headFade":2.6,"tailFade":1.75,"build":1.002,"spread":2.467,"seamStep":2.373,"seamJump":0,"bpm":[88,120,91],"air":-23.614,"mid":-7.041,"bands":{"low":0.501,"lowMid":1.205,"mid":-7.041,"high":-18.707,"air":-23.614},"midShare":0.074}},
      {"file":"Glass_Terrace.mp3","metrics":{"duration":172.513,"isSfx":false,"containerRate":44100,"channels":2,"duplicated":false,"peak":-0.122,"clipped":0,"level":-15.886,"headFade":0.05,"tailFade":1.8,"build":0.188,"spread":2.144,"seamStep":39.794,"seamJump":0,"bpm":[91,88,120],"air":-21.313,"mid":-4.442,"bands":{"low":-0.701,"lowMid":1.797,"mid":-4.442,"high":-15.88,"air":-21.313},"midShare":0.13}},
      {"file":"Glass_Walls.mp3","metrics":{"duration":173.479,"isSfx":false,"containerRate":44100,"channels":2,"duplicated":false,"peak":-0.107,"clipped":0,"level":-15.59,"headFade":0.05,"tailFade":2.7,"build":-0.527,"spread":2.863,"seamStep":32.739,"seamJump":0,"bpm":[91,120,88],"air":-22.81,"mid":-5.675,"bands":{"low":-1.054,"lowMid":2.509,"mid":-5.675,"high":-15.917,"air":-22.81},"midShare":0.094}},
      {"file":"Glass_Walls_at_Noon.mp3","metrics":{"duration":172.774,"isSfx":false,"containerRate":44100,"channels":2,"duplicated":false,"peak":0.054,"clipped":4,"level":-15.397,"headFade":0.05,"tailFade":5.6,"build":0.021,"spread":1.149,"seamStep":38.727,"seamJump":0,"bpm":[91,88,120],"air":-22.847,"mid":-6.977,"bands":{"low":-0.427,"lowMid":2.29,"mid":-6.977,"high":-17.78,"air":-22.847},"midShare":0.071}},
      {"file":"Midday_at_the_Atrium.mp3","metrics":{"duration":173.584,"isSfx":false,"containerRate":44100,"channels":2,"duplicated":false,"peak":-0.15,"clipped":0,"level":-14.977,"headFade":1.35,"tailFade":2.75,"build":1.217,"spread":2.678,"seamStep":4.741,"seamJump":0,"bpm":[91,88,120],"air":-21.122,"mid":-7.427,"bands":{"low":0.155,"lowMid":1.748,"mid":-7.427,"high":-17.335,"air":-21.122},"midShare":0.066}},
      {"file":"Stillness_In_The_Atrium.mp3","metrics":{"duration":173.453,"isSfx":false,"containerRate":44100,"channels":2,"duplicated":false,"peak":-0.109,"clipped":0,"level":-15.184,"headFade":0.1,"tailFade":6.1,"build":1.141,"spread":2.357,"seamStep":31.614,"seamJump":0,"bpm":[88,91,94],"air":-26.216,"mid":-5.002,"bands":{"low":-0.989,"lowMid":1.817,"mid":-5.002,"high":-18.488,"air":-26.216},"midShare":0.119}},
      {"file":"The_Center_of_the_Room.mp3","metrics":{"duration":167.523,"isSfx":false,"containerRate":44100,"channels":2,"duplicated":false,"peak":-0.213,"clipped":0,"level":-15.239,"headFade":4.25,"tailFade":3.05,"build":3.44,"spread":7.777,"seamStep":2.044,"seamJump":0,"bpm":[88,120,122],"air":-21.884,"mid":-5.483,"bands":{"low":-0.462,"lowMid":2.184,"mid":-5.483,"high":-16.836,"air":-21.884},"midShare":0.099}},
      {"file":"The_Clockwork_Atrium.mp3","metrics":{"duration":171.807,"isSfx":false,"containerRate":44100,"channels":2,"duplicated":false,"peak":-0.058,"clipped":0,"level":-15.272,"headFade":0.05,"tailFade":5.05,"build":1.754,"spread":2.794,"seamStep":37.557,"seamJump":0,"bpm":[91,88,120],"air":-22.595,"mid":-5.858,"bands":{"low":-0.814,"lowMid":2.371,"mid":-5.858,"high":-16.782,"air":-22.595},"midShare":0.091}},
      {"file":"Unfinished_Frames.mp3","metrics":{"duration":173.558,"isSfx":false,"containerRate":44100,"channels":2,"duplicated":false,"peak":-0.035,"clipped":0,"level":-15.739,"headFade":0.05,"tailFade":2.6,"build":1.95,"spread":2.87,"seamStep":26.242,"seamJump":0,"bpm":[91,120,72],"air":-23.3,"mid":-6.217,"bands":{"low":0.218,"lowMid":1.872,"mid":-6.217,"high":-17.798,"air":-23.3},"midShare":0.084}},
    ],
  },
];
