# 사운드 에셋 명세 및 라이선스 대장

오디오 담당 작업 기준 문서. 에셋 키는 코드와 이 문서가 동일해야 한다.

- 키/믹스 정의: `client/src/game/config/audioConfig.ts`
- 파일 탐색·매칭: `client/src/game/config/audioAssets.ts`
- 재생 로직: `client/src/game/systems/AudioDirector.ts`
- 로딩: `client/src/game/scenes/BootScene.ts`

## 규격

| 항목 | 기준 |
| --- | --- |
| 포맷 | Ogg Vorbis 권장. `.mp3 .wav .m4a .webm`도 그대로 인식됨 |
| 샘플레이트 | 44.1kHz |
| 채널 | SFX 모노, BGM 스테레오 |
| BGM 길이 | 60초~3분 루프, 이음매에서 클릭 노이즈 없을 것 |
| SFX 길이 | 0.6초 이하, 연사 무기는 0.2초 이하. **반복되는 큐에만 적용된다** — 죽음처럼 판당 한 번 나는 소리는 길어도 된다 |
| 피크 | -3dBFS 이하. 개별 볼륨 밸런스는 `SFX_CONFIG`에서 조정하므로 파일은 정규화만 |

## 필요 파일

파일명은 아래 "이름" 으로 **시작**하기만 하면 된다. 확장자·접미사는 자유.

### BGM — `client/src/assets/audio/music/`

**편성: 오케스트라(첼로·비올라 중심 현악) + 일렉기타.** 신스 중심이 아니다. 팀 합의 사항이므로
개별 곡에서 임의로 벗어나지 않는다.

편성은 전 곡 공통이지만 **정서는 스테이지마다 다르다.** 아포칼립스 정서는 `alley`부터
도착한다. 스테이지 1은 아직 무너지기 전 구간이다.

### 스테이지 1은 어둡게 가지 않는다

스테이지 1 배경은 파란 하늘, 흰 유리 빌딩, 가로수까지 있는 밝고 깨끗한 미래 도시다. 여기에
어두운 단조를 깔면 "망한 세계에서 슬퍼하는" 음악이 되는데, 기획서의 의도는 그게 아니다.

> 평온함 속의 불쾌한 공백. **도시가 너무 정상적으로 작동한다.**

공포의 출처가 "세상이 망했다"가 아니라 **"세상은 멀쩡한데 내가 여기 있으면 안 되는 존재다"**
이다. 따라서 `city`는 밝은 채로 불편해야 한다. 불안은 어둠이 아니라 **해결되지 않는 화음**
(계속 풀리지 않는 서스펜디드 코드, 리디안 모드의 붕 뜬 느낌)으로 만든다.

### 조성 설계

| 곡 | 조성 | 의도 |
| --- | --- | --- |
| `title` | D major | 밝고 정적. 아직 아무 일도 안 일어났다 |
| `city` | D major / D lydian | 밝지만 착지하지 않는다 |
| `alley` | **D minor** | 같은 으뜸음에서 장조 → 단조. 같은 도시가 뒤틀린 것이 음악으로 직접 들린다 |

같은으뜸조 전환이 "세계의 변질"을 가장 적은 비용으로 전달한다. 템포도 90 BPM으로 통일해
두 곡이 같은 곡의 두 얼굴로 들리게 한다.

| 에셋 키 | 이름 | 사용처 | 방향성 |
| --- | --- | --- | --- |
| `bgm-title` | `title` | 타이틀 화면 | 높은 현악 지속음 + 리버브 깊은 클린 기타. 리듬 없음. 정적인 평온 |
| `bgm-city` | `city` | 스테이지 1 (THE CITY) | 밝고 공기감 있는 현악 + 시머 걸린 클린 기타 아르페지오. 예쁜데 텅 비어 있다 |
| `bgm-alley` | `alley` | 스테이지 2 (THE BACK ALLEYS) | **city와 같은 주제**를 단조로 뒤집고 디스토션 기타와 흐트러진 현악으로 변질. 드럼이 처음 들어온다 |

`alley`는 독립된 곡이 아니라 `city`의 변질 버전이다. 두 곡의 주제가 무관하면 "세계가 무너진다"는
연출 의도가 통째로 죽으므로, **city를 먼저 완성하고 그것을 변형해 alley를 만든다.**

~~전 곡 공통으로 중역대(1~4kHz)를 비워 둔다.~~ **실측 결과 폐기됐다.** 총소리가 실제로
앉는 대역은 250Hz~1kHz였고, 그마저도 레벨 차 때문에 문제가 되지 않는다. 근거는
[중역 기준은 폐기한다](#중역-기준은-폐기한다--총소리를-재보니-틀린-대역이었다) 참고.

스테이지 3~5(지하도시/지옥/천국)는 해당 스테이지 구현 후 추가한다. 기획서상 BGM 3~5개가
완료 기준이므로 위 3개로 최소선은 충족한다.

### SFX — `client/src/assets/audio/sfx/`

적은 전부 안드로이드다. 살점 계열(squish, gore)이 아니라 **금속·전자 계열**로 통일해야
세계관이 맞는다.

| 에셋 키 | 이름 | 트리거 이벤트 | 방향성 | 검색어 |
| --- | --- | --- | --- | --- |
| `sfx-smg-fire` | `smg-fire` | `weapon-fired` (weaponId `smg`) | 0.2초 이하 필수. 건조하고 짧게 | `smg shot dry`, `laser shoot short` |
| `sfx-shotgun-fire` | `shotgun-fire` | `weapon-fired` (weaponId `shotgun`) | 묵직한 저역 | `shotgun blast`, `heavy energy shot` |
| `sfx-enemy-hit` | `enemy-hit` | `enemy-damaged` | 금속 임팩트 + 전자 노이즈. 연타되므로 거슬리지 않게 | `metal impact`, `robot hit` |
| `sfx-enemy-down` | `enemy-down` | `enemy-defeated` | 파괴 + 전원 차단 | `robot destroy`, `power down` |
| `sfx-player-hit` | `player-hit` | `player-damaged` | 아래 복선 항목 참고 | `body impact`, `heartbeat monitor` |
| `sfx-player-dash` | `player-dash` | `player-dashed` | 짧은 whoosh. 0.3초 이하 | `whoosh short`, `dash swoosh` |
| `sfx-player-death` | `player-death` | `phase-changed` = `dead` | 저역으로 떨어지는 느낌 | `death impact`, `low drone hit` |
| `sfx-room-locked` | `room-locked` | `room-state-changed` = `locked` | 셔터·자물쇠. 도시의 기계음 | `metal shutter close`, `lock heavy` |
| `sfx-room-cleared` | `room-cleared` | `room-state-changed` = `cleared` | 해제음. 게임 톤이 호러이므로 너무 밝으면 안 된다 | `unlock`, `sci-fi confirm` |

> **`sfx-player-hit` 복선 — 구현했다.** 기획서의 "1~3 스테이지의 피격 순간에 병원 모니터
> 파형을 삽입"에 해당한다. 주인공이 사실 병원에 누워 있다는 힌트이고, 피격음 아래에 심전도
> 비프를 깔아 사운드만으로 성립시켰다. 아래 "모니터 비프는 합성했다" 참고.

### 설치된 SFX (Kenney, 전량 CC0)

9개 큐를 Kenney 팩 3종에서 채웠다. **원본 파일명을 이름 뒤에 남겨 두었다.** 마음에 안 드는
소리를 교체할 때 어느 팩의 어느 파일이었는지 되짚을 수 있어야 한다.

| 큐 | 파일 | 출처 팩 / 원본 | 길이 | 고른 이유 |
| --- | --- | --- | --- | --- |
| `sfx-smg-fire` | `smg-fire_synth-dry.wav` | **자체 합성** (`tools/make-gunshot.mjs`) | 0.16초 | 아래 "총소리는 세 번 갈아엎었다" 참고 |
| `sfx-shotgun-fire` | `shotgun-fire_laser-large-000.ogg` | sci-fi / `laserLarge_000` | 0.677초 | 저역이 지배적이라 SMG와 대비된다 |
| `sfx-enemy-hit` | `enemy-hit_impact-metal-medium-004.ogg` | impact / `impactMetal_medium_004` | 0.107초 | 연타되는 큐라 가장 짧은 금속 타격 |
| `sfx-enemy-down` | `enemy-down_explosion-crunch-000.ogg` | sci-fi / `explosionCrunch_000` | 0.777초 | 파편 섞인 파괴음. 안드로이드에 맞는다 |
| `sfx-player-hit` | `player-hit_impact-punch-medium-001.ogg` | impact / `impactPunch_medium_001` | 0.402초 | 둔탁한 몸통 타격 |
| `sfx-player-dash` | `player-dash_phase-jump-2.ogg` | digital / `phaseJump2` | 0.392초 | 세 팩에 whoosh가 없어 대체품 |
| `sfx-player-death` | `player-death_low-frequency-explosion-001.ogg` | sci-fi / `lowFrequency_explosion_001` | 1.000초 | 저역으로 무너지는 느낌 |
| `sfx-room-locked` | `room-locked_impact-metal-004.ogg` | sci-fi / `impactMetal_004` | 0.390초 | 아래 "방 큐를 갈아엎었다" 참고 |
| `sfx-room-cleared` | `room-cleared_impact-soft-heavy-000.ogg` | impact / `impactSoft_heavy_000` | 0.504초 | 〃 |
| `sfx-monitor-beep` | `monitor-beep_synth.wav` | **자체 합성** (`tools/make-monitor-beep.mjs`) | 0.130초 | 아래 "모니터 비프는 합성했다" 참고 |

**규격에서 벗어난 항목과 그 이유:**

| 항목 | 어긋난 파일 | 판단 |
| --- | --- | --- |
| 길이 0.6초 이하 | `player-death`(1.0초), `enemy-down`(0.78초), `shotgun-fire`(0.68초) | 이 기준은 **연사로 쌓이는 큐**를 막으려는 것이다. 죽음은 판당 한 번, 샷건은 발사 간격이 620ms라 겹치지 않는다 |
| SFX 모노 | impact 팩 3개가 스테레오 | Phaser가 그대로 재생한다. 용량 차이도 수십 KB라 변환할 이유가 없다 |
| 피크 -3dBFS 이하 | 잰 파일이 -0.3 ~ -1.2dBFS | Kenney 팩은 전 파일이 0dBFS 근처로 통일돼 있다. **상대 밸런스가 이미 맞으므로** 절대 레벨은 `SFX_CONFIG`의 큐별 볼륨으로 잡는다 |

디코딩 후 피크가 1.0을 살짝 넘는 파일이 있어도(교체 전 `laserRetro_000`이 +0.9dBFS였다)
실제 재생 게인은 `볼륨 × sfx 0.8 × master 0.9`라 클리핑되지 않는다.

### 방 큐를 갈아엎었다 — 몸통 없는 고역, 그리고 같은 소리 두 개

"방 처음 입장이랑 클리어 소리가 거슬린다"는 피드백. 원인이 둘이었고 두 번째가 더 나쁘다.

| | 길이 | 중심 | 저 | 중저 | 중 | 고 4~8k | 초고 8~16k |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `doorClose_000` (교체 전 잠김) | 0.532초 | 5869Hz | -26.0 | -18.3 | -9.1 | -1.5 | **+3.2** |
| `doorOpen_000` (교체 전 해제) | 0.532초 | 5865Hz | -26.0 | -18.3 | -9.1 | -1.5 | **+3.2** |

**하나. 몸통이 없다.** 저역이 -26dB로 비어 있고 8~16kHz가 가장 센 대역이다. 순수한 고역
히스가 0.53초간 나는 셈인데, 이런 소리는 한 번은 괜찮아도 **방마다 반복되면 가장 먼저
피로해진다.** 고역은 귀가 민감한 대역이라 누적이 빠르다.

**둘. 두 파일이 사실상 같은 소리다.** 위 표에서 보듯 측정값이 소수점까지 일치한다.
`doorOpen`은 `doorClose`를 뒤집은 것이라 스펙트럼이 동일하다. 잠김과 해제는 **정반대
사건인데 같은 소리를 쓰고 있었다.** 플레이어가 소리만으로 구분할 정보가 0이다.

교체 기준은 **서로 다른 축에서 갈리게** 하는 것이다. 같은 계열에서 밝기만 바꾸면 또
헷갈린다.

| 큐 | 파일 | 길이 | 중심 | 성격 |
| --- | --- | --- | --- | --- |
| `sfx-room-locked` | `impactMetal_004` | 0.390초 | 230Hz | **금속.** 단단하고 울린다. 셔터가 내려와 갇힌다 |
| `sfx-room-cleared` | `impactSoft_heavy_000` | 0.504초 | 123Hz | **무연질.** 금속기가 전혀 없이 먹먹하다. 압력이 풀린다 |

재질이 갈리므로 길이나 음높이를 기억하지 않아도 즉시 구분된다. 둘 다 저역 중심이라
교체 전처럼 고역으로 찌르지 않는다.

**볼륨도 낮췄다.** `room-locked` 0.7 → 0.6, `room-cleared` 0.7 → 0.45. 방 전환마다
들리는 소리는 전투 중에 묻혀 지나가는 소리보다 빨리 질린다. 특히 해제음은 전투가 끝나
조용해진 직후에 울리므로 체감이 더 크다.

대안은 `candidates/sfx/`에 `room-locked-1` ~ `-3`, `room-cleared-1` ~ `-3`으로 뒀고
교체 전 둘은 `room-x_*_rejected`로 남겼다.

### 총소리는 세 번 갈아엎었다 — 뿅뿅, 실로폰, 그리고 합성

`sfx-smg-fire` 하나에 네 번 손댔다. 세 번 틀렸고 원인이 매번 달랐다. 과정을 남겨 두는
이유는 다음에 같은 함정을 밟지 않기 위해서다.

**1차 — `laserRetro_000`.** "너무 뿅뿅거린다." 재보니 원인이 둘이었다. 이 파일은 스펙트럼
중심이 5.2kHz에 앉은 사각파 톤이라 얇고 장난감스럽다. 대안이던 `laserSmall_000`은 0.24초
동안 중심이 **아래로 36반음(3옥타브)** 미끄러진다. 그 하강 글라이드가 곧 레이저 효과음의
정체이고 실총에는 없는 성질이다. 레이저 계열 전량 탈락.

**2차 — `impactGeneric_light_000`.** "너무 실로폰 같다." 이번엔 임팩트 계열을 골랐는데도
틀렸다. 원인은 **당시 쓴 잡음도 지표가 고장나 있었기 때문이다.** 스펙트럼 전체의
기하평균/산술평균(spectral flatness)을 썼는데, 이 값은 고역이 일찍 죽는 파일에서 0에 가까운
빈이 많아져 함께 떨어진다. 결국 **잡음도가 아니라 고역 확장을 재고 있었다.**

**지표를 바꿨다.** 프레임마다 100Hz~10kHz 구간에서 **가장 센 성분이 스펙트럼 바닥(중앙값)
위로 얼마나 솟아 있는지**를 dB로 재고 에너지 가중 평균한다. 울리는 음정 타격은 높게,
잡음 폭발은 낮게 나온다. 이 지표는 귀와 일치했다.

세 팩에서 0.6초 이하 132개를 전량 훑은 결과다:

| 파일 | 길이 | 음정감 | 어택 | 피크 뒤 에너지 |
| --- | --- | --- | --- | --- |
| **`impactPlate_light_002`** (3차, 팩 최선) | 0.489초 | **24.5dB** | 3.1ms | 82% |
| `impactPlate_light_000` | 0.542초 | 26.9dB | 1.6ms | 92% |
| `impactPlate_medium_004` | 0.534초 | 27.7dB | 5.3ms | 70% |
| `impactPlate_heavy_001` | 0.349초 | 41.4dB | 3.5ms | 90% |
| `impactTin_medium_003` | 0.212초 | 49.3dB | 1.1ms | 62% |
| `impactGeneric_light_000` (2차 탈락) | 0.138초 | **70.6dB** | 1.3ms | 57% |

2차 채택본이 132개 중 음정감 최상위권이었다. 실로폰이라는 말이 정확했다.

여기서 얻은 것 하나. **1차 때 세운 "짧아야 한다"는 원칙은 음정이 있는 소리에만 맞는다.**
음정이 겹치면 화음이나 울림으로 뭉치지만, 잡음이 겹치면 그냥 연속된 잡음 — 즉 연사음이
된다. 실총 연사도 그렇게 들린다. 그래서 3차에서는 0.489초짜리도 후보로 뒀다.

**3차 — 팩을 포기하고 합성했다.** 3차 후보(`impactPlate_light_002`, 24.5dB)도 여전히
뿅뿅거린다는 피드백이 나왔다. 그런데 그 파일은 **세 팩 132개 중 잡음도 최저였다.** 더
고를 수 있는 게 남아 있지 않다는 뜻이다. 케니 팩은 아케이드용이라 총기 계열 녹음이 애초에
없다.

그래서 `tools/make-gunshot.mjs`로 직접 만들었다. 총성은 음이 아니라 **압력 계단**이므로
합성이 오히려 정공법이다.

첫 시도는 **더 나빠졌다(36.9dB).** 저역 펀치를 사인파로 넣었는데, 순음이야말로 음정감의
극단이다. 밴드패스의 Q도 공진을 만들었다. 전 대역을 잡음으로 바꾸고 필터를 전부
버터워스(Q=1/√2)로 고정하니 19.8dB까지 떨어졌다.

| | 길이 | 음정감 | 중심 | 어택 | 꼬리 |
| --- | --- | --- | --- | --- | --- |
| **합성 A 건조** (채택) | 0.16초 | **19.8dB** | 3209Hz | 2.5ms | 61% |
| 합성 B 개방 | 0.24초 | 17.8dB | 3422Hz | 1.9ms | 77% |
| 합성 C 묵직 | 0.20초 | 30.2dB | 2265Hz | 0.9ms | 91% |
| 팩 최선 `impactPlate_light_002` | 0.489초 | 24.5dB | 2774Hz | 3.1ms | 82% |
| 실로폰 `impactGeneric_light_000` | 0.138초 | 70.6dB | 946Hz | 1.3ms | 57% |

B가 수치상 가장 낮지만 **A를 채택했다.** 무기가 탄알 발사식이고 SMG 발사 간격이 110ms라
꼬리가 짧은 쪽이 맞는다. B는 0.24초에 꼬리 77%라 연사 시 계속 겹친다.

**소리의 정체는 스펙트럼이 아니라 감쇠 시간 비율이다.** 고역은 7ms, 중역은 16ms, 저역은
38ms에 걸쳐 죽는다. 고역이 먼저 사라지는 이 순서가 귀에 "단단한 게 터졌다"로 들린다.
합성이 아니라 이 비율이 핵심이므로, 마음에 안 들면 `make-gunshot.mjs`의 `topTau`,
`midTau`, `lowTau`만 만져도 성격이 크게 바뀐다.

시드를 고정해 두었으므로 **다시 돌리면 바이트 단위로 같은 파일이 나온다.** 들어 본 것과
저장소에 있는 것이 어긋날 일이 없다.

**그래도 안 맞으면 `candidates/sfx/`에 음정감 낮은 순으로 담아 뒀다.** `smg-fire-1` ~
`smg-fire-3`이 합성 셋, `smg-fire-4` ~ `smg-fire-6`이 팩에서 건진 것들이다. 탈락한 셋은
`smg-fire-x_*_rejected`로 남겨 비교할 수 있다. 교체는 `sfx/`의 파일을 지우고 원하는 것을
`smg-fire_`로 시작하게 복사하면 끝이다.

**여기서 더 나아가려면 실총 녹음이 필요하다.** Freesound에서 CC0 필터로 `gunshot dry`,
`9mm indoor`를 받는 편이 합성보다 확실히 낫다. 지금 것은 그때까지의 대체품이다.

### 모니터 비프는 합성했다

`player-hit` 복선용으로 `candidates/sfx/monitor-tone_tone1.ogg`(digital 팩 `tone1`)를
받아 뒀었다. **재보니 쓸 수 없었다.**

| | 기음 | 실질 길이 |
| --- | --- | --- |
| `tone1` 원본 | 261Hz | **80.9ms** (전체 0.684초 중 나머지는 무음) |
| `player-hit` | 16~30Hz + 310Hz | 184ms |

**261Hz는 타격음의 310Hz 바로 옆이다.** 그대로 겹치면 비프가 또렷하게 들리는 게 아니라
타격음을 탁하게 만든다. 그렇다고 모니터 대역(1kHz 내외)으로 올리면 `asetrate`가 피치와
길이를 함께 바꾸므로 **4배에서 20ms가 되어 비프가 아니라 클릭이 된다.** 원본이 81ms짜리
블립이라 어떤 배율에서도 "1kHz이면서 100ms 이상"이 나오지 않는다.

비프는 그냥 음이므로 만드는 편이 싸다. `tools/make-monitor-beep.mjs`가 만든다.

```bash
node tools/make-monitor-beep.mjs client/src/assets/audio/sfx/monitor-beep_synth.wav
```

**1000Hz, 130ms, 상승 2ms / 하강 28ms.** 실제 병실 모니터의 값이다. 순음이 아니라 3배음
-18dB, 5배음 -26dB를 얹었다 — 그 스피커가 작고 싸서 생기는 홀수 배음이 "의료기기 소리"로
읽히게 하는 대부분이다. 사각파까지 가면 4~8kHz에 배음이 쌓이는데, 거기는 타격음이 -47.3dB로
비어 있어 가려 줄 것이 없다.

결과는 타격음과 상보적이다.

| | 저 | 중저 | 중 | 고 |
| --- | --- | --- | --- | --- |
| `player-hit` | **-2.8** | -6.2 | -31.5 | -47.3 |
| `monitor-beep` | -48.2 | -6.2 | **-6.0** | -27.3 |

타격음이 저역을, 비프가 중역을 가진다. 피크로 보면 310Hz와 1000Hz로 1.7옥타브 떨어져 있다.

> 이전 판에는 `player-hit`의 중역이 -25.8dB라고 적혀 있었다. 브라우저 도구 값이고 위 표는
> ffmpeg 기반이라 눈금이 다르다. 결론은 같다.

**볼륨은 0.12다.** 처음에는 귀로 정할 값이라고 적었으나, RMS 대신 **K-가중 라우드니스**로
재면 판단이 선다. 지속음과 트랜지언트를 견주는 데 RMS가 맞지 않았을 뿐이다. 실제 게인
체인(`volume × sfx 0.8 × master 0.9`)을 적용해 렌더한 뒤 순간 라우드니스(400ms 창)로
쟀다. 통합 라우드니스는 -70 LUFS 게이팅이 있어 3초 클립에서는 바닥에 붙는다.

| | 0.12에서 |
| --- | --- |
| 타격음 대비 (비프 단독) | **-8.7 LU** |
| 브금 대비, 700~1400Hz 자기 대역 | **+4.7 LU** |
| 타격 이벤트 전체 라우드니스 증가 | +0.6 LU |
| 트루피크 | -2.4 dBFS |

**대역 비교가 기준이다.** 귀는 주파수로 분리하므로, 광대역으로는 브금(-28.8)이 비프
단독(-30.0)보다 커도 자기 대역에서 비프가 4.7dB 위면 묻히지 않는다.

양 끝이 범위를 정한다. **0.06은 대역 환산 -40.0으로 브금(-38.7) 아래라 묻힌다.** 0.25는
타격음 대비 -2.3 LU여서 복선이 아니라 두 번째 효과음이 된다. **0.10~0.15가 안전 구간**이다.

그래도 최종 확인은 귀로 한다. `D:\Downloads\monitor-beep-ab`에 타격 3연타를 0.09 / 0.12 /
0.18과 타격 단독으로 렌더해 두었다. 한 번씩 들어보면 끝난다.

#### 큐를 겹치는 방법

`SfxConfig.layer`에 적는다. 레이어는 **자기 자신도 큐**여서 `SFX_CONFIG`에 항목을 갖는다.
볼륨과 스로틀을 부모에 파묻지 않고 다른 큐와 같은 자리에서 고치기 위해서다.

```ts
'sfx-player-hit': {
  volume: 0.8,
  layer: { key: 'sfx-monitor-beep', stages: MONITOR_MOTIF_STAGES },
},
'sfx-monitor-beep': { volume: 0.12 },
```

`stages`를 생략하면 모든 스테이지에서 울린다. **겹침은 한 겹까지만이다.** 레이어가 또
레이어를 갖더라도 재생되지 않는다 — 설정이 자기를 가리켜도 무한 재귀가 되지 않아야 한다.

**부모가 실제로 울렸을 때만 레이어가 붙는다.** 스로틀에 걸리거나 파일이 없어 부모가
소리나지 않으면 레이어도 조용하다. 반대로 레이어 파일만 없으면 부모는 정상적으로 울린다.

**스테이지 판정은 `stage-changed`로 들어온 id를 쓴다.** 타이틀로 돌아가면 지워지므로 다음
판에 스테이지가 시작되기 전까지는 레이어가 울리지 않는다. 스테이지 id를 `audioConfig`에
문자열로 적어 둔 것은 `stageConfig`가 이미 `MusicKey` 때문에 `audioConfig`를 참조하고
있어서, 반대 방향으로 `STAGES`를 끌어오면 순환이 닫히기 때문이다.

## BGM 생성 가이드 (AI 사용 시)

현재 사용 도구는 **Google Lyria**. 한 번에 3분 내외가 나오므로 클립을 이어붙일 필요가 없고,
스테이지 체류 시간(방 2개 기준 2~3분)보다 길어 사실상 반복이 인지되지 않는다.

프롬프트는 영어가 결과가 안정적이다. **Lyria에는 네거티브 프롬프트 입력란이 없으므로 제약을
본문에 녹인다.** 이때 `no drums` 같은 부정형은 모델이 부정을 무시하고 명사만 집어가는 경우가
있어 역효과가 난다. 반드시 긍정 서술로 바꿔 쓴다.

| 피할 것 | 대신 쓸 표현 |
| --- | --- |
| `no vocals` | `purely instrumental` |
| `no climax` | `never building to a climax` |
| `no drums` | `percussion-free` |
| `no fade` | `starts immediately at full level`, `loopable background bed` |
| `no build-up` | `the same handful of instruments from beginning to end` |

### city (스테이지 1)

```
bright airy orchestral ambient, delicate high register strings, glassy
shimmering textures, crystalline clean electric guitar arpeggio with light
reverb, light cello underneath, very light percussion, spacious and sparse,
open and luminous, serene and pristine, pleasant but hollow, unresolved
suspended chords that never settle, quietly unsettling, purely instrumental,
one continuous unchanging texture, the same handful of instruments from
beginning to end, the final section sits at exactly the same level as the
opening, starts immediately at full level, loopable background bed,
90 BPM, D major
```

**곡 내부에 밀도 변화를 요구하지 않는다.** 3분짜리는 스테이지 체류 시간(2~3분)보다 길어
플레이어가 한 바퀴를 다 듣지 못하므로, 지루함을 걱정할 필요가 없다. 반면 밀도 변화를
요구하면 모델이 그 골에서 빠져나오는 과정을 상승으로 처리해 루프가 깨진다.

> **이 프롬프트는 더 손대지 않는다.** v3로 세 테이크를 뽑아 확인한 결과, 편차 최악값이
> v2의 7.8dB에서 2.9dB로, 후반 상승 최악값이 3.4dB에서 1.9dB로 내려왔다. 끝 페이드도
> 2.6~2.9초로 좁게 모였고 템포는 세 번 모두 91이었다. 완전히 결정적이지는 않지만
> **남은 변동은 테이크마다 다른 정도이지 프롬프트로 잡을 수 있는 것이 아니다.** 여기서
> 더 고치는 것은 노이즈를 쫓는 일이다. 이후로는 프롬프트를 고정하고 테이크를 늘려 고른다.

### 결과물 선별 기준

여러 테이크를 뽑을 때는 **편집으로 고칠 수 없는 것부터** 본다.

| 순위 | 항목 | 기준 | 이유 |
| --- | --- | --- | --- |
| 1 | 후반 상승 / 구간 편차 | 상승 1.5dB 이하, 편차 3dB 이하 | 편집으로 못 고친다. 여기서 떨어지면 즉시 버린다 |
| 2 | 공기감 8~16kHz | -24dB보다 위 (`audio-check.html` 기준) | 밝은 도시 배경과 맞물린다 |
| 3 | 중역 1~4kHz | ~~-8dB보다 아래~~ **보류** | 실측이 아닌 추정치였고, 표본 11개가 도달 불가임을 보였다. 아래 항목 참고 |
| 4 | 앞뒤 페이드 | — | 항상 잘라내면 되므로 **이것으로 탈락시키지 않는다** |

**-24dB 기준은 `audio-check.html` 눈금이다.** 나중에 만든 `tools/measure-track.mjs`는
창 길이와 기준 레벨이 달라 같은 곡이 6~9dB 낮게 나온다. city 채택본이 전자로 -20 대,
후자로 -29.8이다. 도구를 섞어 이 기준에 대보면 전부 미달로 읽힌다.

#### 첫 결과물에서 확인된 것

1차 생성물을 `tools/audio-check.html`로 측정한 결과 다음이 드러났고, 위 프롬프트는 이미
반영된 상태다.

- **밝기를 지시하는 말과 어둡게 만드는 말이 충돌하고 있었다.** `bright airy`와 `high
  register`를 넣어도 `muted strings`가 이겼다. 현악에서 muted는 약음기(con sordino)를
  뜻하므로 문자 그대로 고역을 깎으라는 지시가 된다. 결과는 1kHz 아래에 에너지 94%가 몰린
  어두운 곡이었다. **악기 상태를 나타내는 단어가 분위기 형용사보다 강하게 먹는다.**
- `even level throughout`은 절반만 작동했다. 후반부가 앞부분보다 2dB 이상 높은 채로 끝나
  루프가 돌 때 단차가 생겼다. 추상적인 지시 대신 `the final section sits at exactly the
  same level as the opening`처럼 비교 대상을 명시해야 한다.
- `thins out in the middle section then returns`는 지시대로 작동했다. 곡 중반에 실제로
  레벨이 내려앉는 구간이 생겼다. **다만 이것이 뒤에서 문제가 된다. 아래 재현성 항목 참고.**
- `90 BPM`은 안정적으로 반영됐다. 이후 모든 테이크가 88~91로 나왔다.
- 끝 페이드아웃은 프롬프트로 막지 못했다. 생성 후 잘라내는 것을 전제로 한다.

결과 조정:

- 너무 희망차고 벅차면 → `serene and pristine`을 빼고 `pleasant but hollow`, `unresolved`를
  앞으로 당긴다. 앞쪽 태그일수록 강하게 반영된다
- 너무 기분 나쁘면 → `quietly unsettling`을 뺀다. 스테이지 1은 아직 티를 내면 안 된다
- 탁하게 뭉개지면 → 뒤에서부터 태그를 지운다. 태그가 많을수록 좋아지는 것이 아니라 서로
  상쇄된다. 뼈대는 `bright airy orchestral ambient` + `cello` + `clean electric guitar` +
  `sparse` + `90 BPM, D major`
- `sparse` 계열은 어떤 경우에도 빼지 않는다. 총소리가 들어갈 자리다

### 생성 기록

어떤 프롬프트가 어떤 파일을 만들었는지 남긴다. 이 대응이 없으면 다음 곡을 만들 때 무엇이
먹혔고 무엇이 안 먹혔는지 다시 알아내야 한다.

생성 도구는 전부 **Gemini 웹 앱(gemini.google.com)의 Lyria**다.

아래 측정값은 모두 각 곡의 평균 레벨로 정규화하고 앞뒤 페이드 구간을 제외한 값이다.
큐는 모두 `bgm-city`다.

| 파일 | 프롬프트 | 후반 상승 / 편차 | 공기감 8~16k | 중역 1~4k | 페이드 앞/뒤 | 상태 |
| --- | --- | --- | --- | --- | --- | --- |
> **채택은 `The_Center_of_the_Room.mp3`으로 끝났다.** 아래 "청취 후보"는 측정값으로 좁힌
> 목록이었고, 실제로 사람이 고른 곡은 그 안에 없었다. 기록은 프롬프트 튜닝 근거로 남긴다.

**청취 후보 (측정값 기준 상위 넷 — 실제 채택곡은 여기 없다)**

| 파일 | 프롬프트 | 후반 / 편차 | 공기감 | 중역 | 페이드 | 왜 남았나 |
| --- | --- | --- | --- | --- | --- | --- |
| `Glass_Walls_at_Noon.mp3` | v3 | **+0.0 / 1.1** | -22.8 | **-7.0** | 0.1 / 5.6초 | **측정상 가장 강하다.** 다이내믹과 중역을 동시에 잡은 유일한 테이크 |
| `Midday_at_the_Atrium.mp3` | v3 | +1.2 / 2.7 | **-21.1** | -7.4 | 1.4 / 2.8초 | 공기감과 중역이 함께 좋다 |
| `Glass_Terrace.mp3` | v3 | +0.2 / **2.1** | **-21.3** | -4.4 | **0.1 / 1.8초** | 다이내믹·공기감·페이드 모두 최상. 중역만 나쁘다 |
| `A_Room_Without_Walls.mp3` | v2 | +1.3 / 2.0 | -23.7 | **-9.1** | 2.6 / 5.3초 | 중역이 유일하게 기준을 통과한다 |

**나머지 후보**

| 파일 | 프롬프트 | 후반 / 편차 | 공기감 | 중역 | 페이드 | 비고 |
| --- | --- | --- | --- | --- | --- | --- |
| `Atrium_at_Midday.mp3` | v3 | **-0.2 / 0.7** | -22.9 | -4.0 | 0.1 / 2.9초 | 다이내믹 최상. 직전까지 잠정 선택이었다 |
| `Glass_Walls.mp3` | v3 | -0.5 / 2.9 | -22.8 | -5.7 | 0.1 / 2.7초 | |
| `Glass_in_the_Afternoon.mp3` | v3 | +1.0 / 2.5 | -23.6 | -7.0 | 2.6 / 1.8초 | `Glass_Walls_at_Noon`이 전 항목에서 우세하다 |
| `Unfinished_Frames.mp3` | v3 | +1.9 / 2.9 | -23.3 | -6.2 | 0.1 / 2.6초 | 후반 상승 초과 |
| `The_Clockwork_Atrium.mp3` | v3 | +1.8 / 2.8 | -22.6 | -5.9 | 0.1 / 5.1초 | 후반 상승 초과 |
| `Stillness_In_The_Atrium.mp3` | v3 | +1.1 / 2.4 | **-26.2** | -5.0 | 0.1 / 6.1초 | 공기감 미달. 가장 어둡다 |
| `The_Center_of_the_Room.mp3` | v2 | +3.4 / 7.8 | -21.9 | -5.5 | 4.3 / 3.1초 | 다이내믹 미달 |
| `Glass_and_Cedar.mp3` | v1 | +2.0 / 2.7 | -25.8 | -8.1 | 0.1 / 4.8초 | 공기감 미달 |

파일은 모두 `client/src/assets/audio/candidates/`에 있다. **"잠정 선택"은 측정값만으로
좁힌 결과이고 확정이 아니다.** 두 사람이 듣고 정한다.

### 중역 기준은 폐기한다 — 총소리를 재보니 틀린 대역이었다

`sfx-smg-fire`가 들어와서 약속대로 실제 총소리 대역을 쟀다. **결론부터: 비워야 할 대역을
잘못 짚고 있었다.**

| | 250Hz~1k | **1~4k** | 4~8k | 8~16k |
| --- | --- | --- | --- | --- |
| `sfx-smg-fire` (`synth-dry`) | **+0.8** | -1.4 | -5.5 | -10.5 |
| `bgm-city` (`The_Center_of_the_Room`) | **+2.2** | -5.5 | -16.8 | -21.9 |

각 파일의 자기 평균 대비 dB다. **총소리는 특정 대역에 앉지 않는다.** 채택본은 250Hz에서
8kHz까지 6dB 안쪽에 고르게 퍼져 있는데, 광대역 잡음이니 당연한 결과다. 비워 둘 자리를
정한다는 발상 자체가 성립하지 않는다.

굳이 대역을 따지면 BGM이 가장 두꺼운 곳은 250Hz~1kHz(+2.2)이고 총소리도 거기가 가장
세다(+0.8). 정작 그동안 지켜 온 1~4kHz는 **BGM이 이미 -5.5dB로 물러나 있는 대역이었다.**
아무도 안 오는 방을 계속 비워 두고 있었던 셈이다.

그런데 실제로는 문제가 되지 않는다. 대역이 겹쳐도 **레벨 차가 압도적**이기 때문이다.
BGM은 평균 -15.2dBFS로 깔려 있고 총소리는 피크 -1dBFS에 어택 3.1ms인 트랜지언트다.
지속음 위에 순간음이 얹히는 구조라 마스킹이 성립하지 않는다.

따라서 **주파수 슬로팅으로 BGM을 탈락시키지 않는다.** -8dB 기준은 폐기한다. 실제로 묻히면
`AUDIO_MIX_CONFIG`의 `music` 볼륨을 낮추는 편이 곡을 바꾸는 것보다 싸다.

**진짜 겹치는 조합은 따로 있다.** `sfx-enemy-hit`도 250Hz~1kHz(+2.2) / 1~4kHz(+0.7)에
에너지가 앉는데, 이 큐는 총알이 맞은 직후 울리므로 `smg-fire`와 거의 동시에 난다. 지금은
`minInterval: 45`와 볼륨 0.45로 눌러 두었고, 연사 중 뭉치면 여기부터 손본다.
`shotgun-fire`는 저역(-0.1) 중심이라 SMG와 자연히 갈린다.

**city 테이크 생성은 여기서 멈춘다.** 11개면 분포가 드러났고, 애초에 좁히려던 기준이
근거를 잃었다. 더 뽑아도 기대값이 오르지 않는다.

v1 대비 v2에서 확인된 것:

- **고역이 올라왔다.** 8~16kHz가 +2.1dB, 4~8kHz가 +1.2dB. `glassy shimmering` /
  `crystalline`이 작동했다. 다만 250Hz~1kHz도 +1.1dB 올라가고 1~4kHz는 내려가, 전체가
  균일하게 밝아진 것이 아니라 **가운데가 파인 형태**가 됐다.
- **후반 상승이 잡혔다.** +2.2dB → +0.7dB. 구간 편차도 3.0dB → 2.1dB. 추상적인
  `even level throughout` 대신 비교 대상을 명시한 문장으로 바꾼 효과다.
- 시작 페이드가 새로 생겼다(0.05초 → 2.55초). 페이드는 프롬프트로 통제되지 않는다.

같은 v2 프롬프트로 두 번 뽑아 재현성을 확인한 결과, **레벨 평탄화는 운에 가까웠다.**
한 테이크는 후반 상승 +1.3dB인데 다른 테이크는 +3.4dB에 편차 7.5dB였다. 원인은 프롬프트
자체에 있었다.

`thins out in the middle section then returns`가 지나치게 잘 작동해 곡 중반을 -4.7dB까지
파냈고, 모델은 거기서 돌아오는 과정을 계속 쌓아 올리는 방식으로 처리했다. 그 결과
`never builds to a climax`와 정면으로 충돌했다. **서로 반대로 당기는 문장을 함께 넣은,
`muted` 대 `bright`와 같은 종류의 실수다.**

v3에서는 밀도 변화 요구를 아예 제거하고, 후반 상승의 실제 메커니즘인 악기 추가를 막는
`the same handful of instruments from beginning to end`로 대체했다. 편성이 고정되면
소리가 커질 방법이 없다.

**밝기는 여기서 멈춘다.** 배경과 톤이 맞는 지점에 이미 도달했다. 당시에는 "더 밝게 하려면
1~4kHz를 채워야 하는데 그 대역이 총소리 자리"라고 적었는데, 뒤에 실측해 보니 그 전제가
틀렸다(아래 참고). 결론만 우연히 맞았다.

v3에서 확인된 것:

- **다이내믹이 완전히 잡혔다.** 후반 상승 -0.1dB, 구간 편차 0.4dB로 3분 내내 사실상
  일직선이다. `the same handful of instruments from beginning to end`가 정확히 작동했다.
  후반이 커지는 실제 원인은 악기가 추가로 들어오는 것이고, 편성을 고정하면 커질 방법이 없다.
- 시작 페이드가 0.05초로 사라졌다. `starts immediately at full level`이 통했다.
  다만 v1에서도 시작 페이드는 없었으므로 이 문장의 효과인지는 표본이 더 필요하다.
- **중역 1~4kHz가 -3.9dB로 올라와 기준(-8dB)을 넘겼다.** 곡이 더 또렷해졌다는 뜻이다.
  이 기준은 이후 실측으로 폐기됐다.

### 채택본 — `city_the-center-of-the-room.mp3`

**측정값이 아니라 사람이 골랐다.** 원래 그러기로 한 절차대로다. 이 곡은 측정상 다이내믹
항목에서 가장 나빴는데(후반 상승 +3.4dB, 구간 편차 7.8dB), 뒤집어 말하면 **기복이 있다는
뜻이고 그게 듣기에는 좋았다**는 것이다. 측정으로 곡을 고를 수 없다는 근거가 하나 늘었다.

#### 가공 완료 — `city_the-center-of-the-room.ogg`

ffmpeg로 실측하고 나서 **앞서 적어 둔 페이드 수치가 둘 다 틀렸다는 것이 드러났다.**

| 항목 | 이전 기록 | 실측 |
| --- | --- | --- |
| 앞 | 페이드인 4.25초 | **페이드가 아니라 12초에 걸친 인트로 빌드.** -40.9dB에서 시작해 서서히 올라온다 |
| 뒤 | 페이드아웃 3.05초 | **페이드 없음.** 끝까지 -14.2dB로 평탄하다가 그대로 끊긴다 |

브라우저 도구는 진폭이 일정 비율에 도달하는 시점을 쟀는데, 그 값은 페이드와 편곡상의
빌드를 구분하지 못한다. 페이드를 잘라내는 작업이 아니라 **구간을 고르는 작업**이었다.

4초 이동평균으로 본 전체 윤곽은 이렇다.

```
  0~ 12s  -34 → -18.5   인트로 빌드
 24~104s  -16.6 ~ -15.8  플래토 (편차 0.8dB)
104~160s  -16.1 → -14.2  후반 크레셴도
160~167s  -14.2 평탄, 하드 컷
```

**루프 구간은 24.000s ~ 101.350s(77.35초)로 잡았다.** 플래토 안에 들어가 인트로 빌드와
후반 크레셴도를 모두 피한다. 규격의 60초~3분도 만족한다.

끝점은 **파형 상관으로 찾았다.** 시작 지점의 1초와 가장 닮은 지점을 40~150초에서 훑었고
101.35초에서 상관 0.576으로 최고였다. 24초 배수(48/72/96초)는 0.10~0.18에 그쳤다.
**이 곡은 일정 주기로 반복되는 구조가 아니라 A 파트가 101.35초에 돌아오는 형태다.**
BPM을 몰라도 마디를 맞출 수 있었던 이유가 이것이다.

레벨이 더 잘 맞는 후보(101.73초, 레벨차 0.38dB)도 있었지만 상관이 0.36으로 낮았다.
**상관을 택했다.** 레벨차 2.3dB는 크로스페이드 0.8초에 걸쳐 완만히 오르므로 음악적 변동
범위 안이지만, 상관이 낮으면 겹치는 두 소재가 따로 들린다.

> 이 절의 0.576은 브라우저 `OfflineAudioContext`로 잰 값이다. 나중에 만든
> `tools/measure-track.mjs`로 같은 지점을 재면 0.430이 나온다. 창 길이와 샘플레이트가
> 다르므로 **다른 절의 숫자와 나란히 비교하지 말 것.** 판단 자체는 유효하다 — 어느
> 도구로 재도 101초대가 24초 배수보다 압도적이다.

**크로스페이드는 등파워가 아니라 리니어다.** 등파워는 서로 무관한 소재의 레벨을 지켜주는
곡선인데, 잘 고른 루프 지점은 정의상 두 소재가 닮아 있어 오히려 최대 3dB를 더한다.
실측으로 확인했다.

| 곡선 | 크로스페이드 구간 | 직후 본편 | 차이 |
| --- | --- | --- | --- |
| 등파워 | -14.62dB | -17.09dB | **+2.47dB** |
| 리니어 | -16.71dB | -17.09dB | **+0.38dB** |

이어붙여 검사한 결과 이음매의 샘플 도약은 0.0225로, 곡 내부 평상시 0.0587보다 작다.
**클릭이 생기지 않는다.**

#### 코덱은 Opus를 쓴다

확장자는 `.ogg` 그대로다. `.ogg`는 상자일 뿐이고 그 안에 Vorbis를 넣느냐 Opus를 넣느냐가
따로이며, **파일명도 코드도 바뀌지 않는다.**

같은 77.35초 스테레오를 인코딩한 실측이다.

| 확장자 | 코덱 | 크기 |
| --- | --- | --- |
| `.wav` | 무압축 PCM | 13.01 MB |
| `.mp3` | MP3 192k | 1.77 MB |
| `.mp3` | MP3 128k | 1.18 MB |
| `.m4a` | AAC 128k | 1.21 MB |
| `.ogg` | Vorbis q4 | 1.12 MB |
| **`.ogg`** | **Opus 80k** | **0.90 MB** |
| `.webm` | Opus 80k | 0.92 MB |

**확장자를 바꿔서 줄이는 것이 아니다.** `.ogg`가 이미 최선의 상자이고, 줄일 여지는 그 안에
무엇을 넣느냐에 있다. `.mp3`나 `.m4a`로 가는 것은 같은 용량에서 음질이 나빠지는 역행이다.
원본이 mp3였던 것은 Lyria의 출력 형식이지 선택이 아니다.

Opus는 디코딩도 빠르다(181ms → 114ms). 디코딩은 메인 스레드에서 일어나므로 그만큼
게임 시작이 빨라진다.

**음악 자체는 변하지 않는다.** 음정도 템포도 편곡도 길이도 그대로이고, 같은 소리를 더 적은
바이트로 적을 뿐이다. 손실 압축인 것은 맞지만 그것은 지금 쓰는 Vorbis도, Lyria가 준 원본
mp3도 마찬가지이며, 바이트당 보존량은 Opus가 더 낫다.

| | 4~8k | 8~16k |
| --- | --- | --- |
| 무손실 원본 | -48.6 | -52.1 |
| Opus 80k | -48.5 | -52.3 |

**규격에서 벗어나는 점 하나.** Opus는 48kHz로만 저장되므로 44.1kHz 기준을 만족하지 못한다.
다만 `decodeAudioData`가 어떤 파일이든 장치 샘플레이트로 리샘플하므로 실제 재생에는 차이가
없다. 실측에서도 Vorbis 파일이 48000Hz로 디코딩됐다.

미확인 항목은 Safari다. Opus-in-Ogg는 Safari 15부터 지원되어 현재는 문제가 없을 것으로
보이지만 직접 확인하지는 못했다. 크롬 디코딩은 확인했고 e2e도 크로미움이다.

최종: 77.35초 / **Ogg Opus 80k** / 48kHz 스테레오 / 피크 -3.2dBFS / **0.90MB**.
원본 4.03MB 대비 **76.6% 감소**.

인코딩 명령은 이것이다.

```bash
ffmpeg -i final.wav -c:a libopus -b:a 80k city.ogg
```

재현 스크립트는 `tools/make-loop.mjs`다. 인자로 시작·끝·크로스페이드·목표 피크·곡선을
받으므로 다른 곡에도 그대로 쓴다.

### 후보 파일 관리

최종 판단은 귀로 하고 그 귀가 한 사람일 필요는 없으므로, **후보는 저장소에 남겨 두 사람이
같이 듣는다.** 측정값은 후보를 좁히는 데 쓰고 고르는 것은 사람이 한다.

| 위치 | 역할 |
| --- | --- |
| `client/src/assets/audio/candidates/<큐>/` | 좁혀낸 후보. **청음용 Opus 64kbps 사본** |
| `client/src/assets/audio/sources/` | **채택곡의 원본.** 가공은 반드시 여기서 시작한다 |
| `client/src/assets/audio/music/`, `sfx/` | 현재 잠정 선택 하나. 파일명이 큐 이름으로 시작한다 |
| GitHub 릴리스 `audio-takes-*` | 탈락 포함 **모든 테이크의 원본 MP3.** 저장소 밖 보관 |

후보는 큐별로 나눈다(`candidates/title/`, `candidates/alley/`). 한 폴더에 섞이면 어느 곡이
어느 큐 후보인지 알 수 없고, 점검 도구에서 폴더를 통째로 열 때도 관계없는 곡이 딸려 온다.
파일명은 `take<번호>_원래제목`으로 둔다. **번호는 순위가 아니라 생성 순서**이고, 위 생성
기록 표의 행 번호와 같다.

#### 원본을 저장소에 전부 넣지 않는 이유

city는 테이크 12개를 원본 MP3로 커밋했고 48MB가 들어갔다. 그 방식을 title·alley에도
적용하면 +36.7MB이고, 스테이지 3~5까지 가면 100MB가 더 붙는다.

**한 번 커밋한 것은 지워도 줄지 않는다.** `git rm`은 작업 트리에서만 없애고 blob은 히스토리에
영구히 남으므로 클론 용량은 그대로다. 회수하려면 히스토리 재작성과 강제 푸시가 필요한데,
공개 저장소에 협업자가 붙어 있는 동안 할 수 있는 일이 아니다. **그러므로 커밋 시점에
결정해야 한다.**

그래서 이렇게 나눈다.

- **좁혀낸 후보만** 저장소에. 그것도 Opus 64kbps로. 5곡이 7.0MB다
- **모든 원본은** 릴리스 첨부물로. 히스토리 비용이 0이고 진짜로 삭제할 수 있다
- **채택곡의 원본만** `sources/`에. 마스터링 소스는 저장소 안에 있어야 한다

city 채택본 원본을 `candidates/city/`에서 `sources/`로 옮긴 것은 **유지 비용이 0**이기
때문이다. blob이 이미 히스토리에 있으므로 지워도 클론이 작아지지 않는다. 같은 값이면
남겨서 언제든 다시 마스터링할 수 있게 두는 쪽이 낫다.

**Opus 64kbps가 판정을 훼손하지 않음은 실측으로 확인했다.** 후보 5곡 전부를 원본과 사본으로
재서 빌드는 동일, 대역은 최대 0.9dB 차이(4번 공기감 -41.2 → -40.3), 박 상관은 최대 0.017
차이였다. 후보 사이의 격차가 5dB 이상이므로 순서가 뒤집히지 않는다. 다만 **가공은 사본으로
하지 않는다** — 자르고 크로스페이드를 걸면 세대 손실이 쌓인다.

`sources/`도 빌드에 실리지 않는다. 글롭이 `music`과 `sfx`만 이름으로 잡고
`discoverFiles`가 한 번 더 폴더를 걸러내므로 이중으로 막혀 있다.

**SFX 후보만 예외로 `candidates/sfx/` 한 폴더를 같이 쓴다.** 큐가 9개인데 폴더를 9개
만들면 파일 하나짜리 폴더가 늘어날 뿐이다. 대신 **파일명을 `<큐>-<순위>_원본이름`으로**
둔다(`smg-fire-2_impactPlate_heavy_003.ogg`). 탈락시킨 것은 `-x`와 `_rejected`를 붙여
남긴다. 왜 안 되는지가 다음 선택의 근거가 된다.

`candidates/`는 **빌드에 포함되지 않는다.** `audioAssets.ts`의 글롭이 `music`과 `sfx`
두 폴더만 이름으로 지정하기 때문이다. 이 부분을 `*`로 되돌리면 탈락한 테이크 수십 MB가
제출 빌드에 그대로 실린다.

후보를 `music/`에 두면 안 되는 이유는 하나 더 있다. `city`로 시작하는 파일이 둘 이상이면
이름이 짧은 쪽이 자동 선택되므로 어느 것이 재생 중인지 알 수 없게 된다.

**듣고 비교하는 방법:** `tools/audio-check.html`을 더블클릭하고 `candidates/<큐>/` 폴더의
파일을 끌어다 놓는다. 여러 개를 한 번에 놓으면 비교표가 뜨고 각 행에서 바로 재생된다.

**미리 구워둔 후보 목록(`tools/audio-candidates.js`)은 제거했다.** city 테이크 12개를 열
때마다 재분석하지 않으려고 만든 캐시였고, city가 확정되면서 가리키던 파일이 없어졌다.
그 12개의 측정값은 위의 city 테이크 표에 그대로 남아 있다. 그리고 측정의 기준 도구가
`tools/measure-track.mjs`로 옮겨간 뒤로는 브라우저 값과 눈금이 달라 한 표에 섞을 수도 없다.

**역할이 갈렸다고 보면 된다.** 숫자는 `measure-track.mjs`로 재고, `audio-check.html`은
**귀로 듣고 말로 된 판정을 보는** 용도로 쓴다.

### 가공 작업

생성물은 그대로 쓰지 않는다. 순서는 **페이드 제거 → 마디 맞추기 → 루프 크로스페이드 →
피크 노멀라이즈(-3dBFS)**이고, 노멀라이즈는 자른 뒤 피크가 달라지므로 반드시 마지막이다.

**곡마다 난이도와 방법이 다르다. 리듬이 있느냐가 갈림길이다.**

| 곡 | 마디 경계 | 크로스페이드 | 이유 |
| --- | --- | --- | --- |
| `title` | 신경 쓰지 않아도 된다 | **길게 2~4초** | 박이 없어 아무 데서나 잘라도 된다. 대신 리버브 꼬리가 길어 짧게 자르면 뚝 끊긴다. 리듬이 없으니 길게 겹쳐도 뭉개지지 않는다 |
| `city` | **맞춰야 한다** | 중간 0.5~1초 | 아르페지오와 약한 퍼커션이 있다. 너무 길게 겹치면 아르페지오가 서로 뭉갠다 |
| `alley` | **가장 엄격하다** | **짧게 50~200ms** | 드럼이 들어온다. 킥이 어긋나면 즉시 들키고, 크로스페이드가 길면 킥이 두 번 치는 것처럼(플램) 들린다 |

한 마디 길이는 `60 / BPM * 4`초다. 91 BPM이면 약 2.64초.

**저장 포맷은 Ogg Vorbis로 한다.** 편집 후 다시 mp3로 저장하면 세대 손실이 누적되고,
wav는 3분 스테레오가 30MB를 넘는다. ogg는 용량이 mp3 수준이면서 게임이 그대로 인식한다.

### title / alley 프롬프트와 생성 기록

city와 달리 **Pro 모델이 곡 구조를 만들려는 성향과 싸우는 것**이 핵심 과제였다. Vertex 문서에
"인트로·벌스·코러스·브릿지 같은 구조 요소를 이해한다"고 적혀 있고, 우리가 원하는 것은 구조가
없는 정적인 베드다. city도 12초 인트로 빌드와 후반 크레셴도가 있었고, title 초기 테이크들은
빌드가 +7.2dB, +3.8dB까지 갔다.

세 방향을 각각 시도했다.

**A — 드론 베드 + 반복 명시 + 템포 제거**

```
sustained ambient drone bed, delicate high register strings holding one
unresolved suspended chord throughout, glassy shimmering textures, crystalline
clean electric guitar sounding single notes that decay into silence, light
cello sustaining underneath, free time with no pulse, rubato, no percussion of
any kind, the harmony never moves to another chord, the same eight bars
repeated over and over for the entire duration, every passage sounds like every
other passage, spacious and sparse, open and luminous, calm and static, purely
instrumental, starts immediately at full level, the final minute sits at
exactly the same level as the opening minute, loopable background bed, D major
```

**BPM 숫자를 일부러 뺐다.** 박이 없어야 하는 곡에 템포를 주면 모델이 그리드를 만들 이유가
생긴다. city는 아르페지오와 약한 퍼커션이 있어 필요했지만 title은 반대다.

**B — 녹음물로 프레이밍**

```
a single held string chord recorded in a large empty hall, delicate high
register violin and viola sustaining without vibrato, glassy shimmering air
around them, one crystalline clean guitar note every few bars fading into the
room, light cello drone underneath, free time, no pulse, no percussion, the
same chord for the entire duration, nothing enters and nothing leaves, ambient
field recording of one moment stretched out, purely instrumental, starts
immediately at full level, loopable, D major
```

작곡이 아니라 "한 순간을 늘여놓은 필드 레코딩"이라고 하면 구조를 만들 명분이 없어지지
않을까 하는 시도다.

**C — 짧은 미니멀**

```
delicate high register strings sustained, glassy shimmering textures,
crystalline clean electric guitar, light cello drone, free time, no pulse, one
unchanging chord, spacious and sparse, purely instrumental, loopable, D major
```

프롬프트 길이 자체가 변수인지 보려는 것이다. 짧으면 모델이 구조를 붙일 여지가 줄어들 수 있다.

**alley는 반대로 박이 있어야 한다.** 드럼이 처음 들어오는 곡이므로 88 BPM을 명시하고,
city와 **같은 으뜸음 D**를 유지한 채 장조만 단조로 뒤집는다.

```
dark orchestral, low unsteady cello and viola, distorted electric guitar
arpeggio detuned and grinding, sparse slow drum kit with kick and snare on a
steady grid, strings drifting slightly out of tune with each other, decayed and
menacing, familiar but wrong, purely instrumental, one continuous unchanging
texture, the same handful of instruments from beginning to end, the same eight
bars repeated over and over for the entire duration, the final section sits at
exactly the same level as the opening, starts immediately at full level,
loopable background bed, 88 BPM, D minor
```

**88 BPM은 실측값이다.** 문서 계획값은 90이었지만 채택된 city(`The_Center_of_the_Room`)는
v2 테이크이고 온셋 자기상관으로 88.5가 나왔다. alley는 채택본에 맞춘다.

alley B는 위에 `the same theme as a bright D major city piece now turned wrong`와
`distorted electric guitar taking over the arpeggio the clean guitar used to play`를
더해 **city 파생을 문장으로 명시한 것**이고, alley C는 드럼을 `full drum kit with a steady
driving kick and snare pattern audible throughout`로 앞세운 것이다.

#### 생성 기록 (10테이크)

| 순서 | 큐 | 프롬프트 | 길이 | 제목 |
| --- | --- | --- | --- | --- |
| 1 | title | A | 179.6초 | The Glass Horizon |
| 2 | title | B | 170.0초 | Sunlight Through the Atrium |
| 3 | title | C | 176.5초 | The Longest Breath |
| 4 | title | A | 169.6초 | Sunlight Through a Pane |
| 5 | title | B | 179.1초 | Noon in the Atrium |
| 6 | alley | A | 166.5초 | Under the Iron Ceiling |
| 7 | alley | A | 130.2초 | The Unsteady Corridor |
| 8 | alley | B | 136.0초 | Gravity of the Concrete |
| 9 | alley | B | 127.4초 | The Warped Foundation |
| 10 | alley | C | 166.7초 | Torsion of the Girders |

제목이 곧 순서가 아니다. 2·3·4번은 생성 당시 제목을 확인하지 못해 비워두었고, 나중에
받은 파일 순서와 **길이가 위치별로 전부 일치**하는 것으로 확정했다. 2번과 4번은 둘 다
170초여서 길이만으로는 갈리지 않으므로 받은 순서를 근거로 삼는다.

#### 측정 결과

**기준은 city 원본이다.** 가공본과 비교하면 우리가 손본 결과와 모델 출력을 비교하는
것이 되어 프롬프트의 성패를 알 수 없다. 아래는 전부 `tools/measure-track.mjs` 한 도구로
다시 잰 값이다.

title — 목표는 빌드 0, 박 0.3 이하, city 수준의 공기감

| | city 원본 | 1 (A) | 2 (B) | 3 (C) | 4 (A) | 5 (B) |
| --- | --- | --- | --- | --- | --- | --- |
| 빌드 | +4.5 | **-0.2** | +2.4 | +1.2 | +2.3 | **-0.6** |
| 박 | 0.676 @ 88.5 | 0.498 @ 80 | 0.636 @ 159 | **0.370** @ 80 | 0.385 @ 80 | 0.444 @ 80 |
| 공기감 8~16k | **-29.8** | -46.6 | -43.4 | **-41.0** | -41.2 | -41.7 |
| 루프 상관 | 0.430 | 0.372 | 0.398 | 0.425 | 0.351 | **0.540** |

**빌드 제어는 성공했다.** city 원본이 +4.5dB인데 1·5번은 사실상 0이다. Pro의 구조 생성
성향을 프롬프트로 이긴 첫 사례이고, BPM 제거와 `the same eight bars repeated over and
over`가 효과였을 가능성이 크다.

**밝기 지시는 실패했다.** 전 테이크가 city보다 11~17dB 어둡다. 인코더 탓이 아니다 —
city 원본도 같은 192kbps MP3인데 -29.8이다. 곡 내용의 차이다. `glassy shimmering`,
`luminous`, `crystalline` 같은 어휘는 고역 에너지로 번역되지 않았다.

**박도 실패했다.** `free time`, `no pulse`, `rubato`를 넣고 BPM을 빼도 5개 중 4개가
80.25 BPM 그리드에 붙었다. 목표 0.3을 넘긴 테이크가 하나도 없다. 프롬프트로 박을
없애는 것은 여기서 포기한다.

alley — 목표는 city와 같은 88 BPM, 왜곡, 평평한 빌드

| | 6 (A) | 7 (A) | 8 (B) | 9 (B) | 10 (C) |
| --- | --- | --- | --- | --- | --- |
| 빌드 | +2.7 | **-0.2** | +0.3 | +4.9 | +0.7 |
| 박 | 0.480 @ 44.75 | 0.531 @ **87.00** | 0.479 @ **87.00** | 0.580 @ 116 | 0.714 @ 59.75 |
| 공기감 8~16k | -30.9 | -29.0 | -31.0 | -27.9 | **-26.6** |
| 루프 상관 | 0.587 | 0.451 | **0.594** | 0.839 | 0.471 |

**alley는 오히려 city보다 밝다.** 왜곡이 배음을 만드니 물리적으로 맞다. 밝기를 직접
지시해서 얻지 못한 고역을 왜곡 지시가 부산물로 만들어냈다.

**88 BPM 지시는 먹혔다.** 7·8번이 87.00에 정확히 붙었고, 6번은 44.75 — 89.5의 절반이라
하프타임으로 느껴지는 것이지 템포가 틀린 것은 아니다. 9·10번만 벗어났다.

#### 후보

후처리로 **못 고치는 것부터** 본다. 박은 아예 못 고치고, 공기감은 하이셸프로 올릴 수
있으나 없는 내용을 만들지는 못하고, 루프는 구간 선택으로 개선되고, 빌드는 평탄부를
잘라내면 사라진다.

- **title → 3·4·5번.** 3번이 박·공기감 모두 선두다. **1번은 빠진다** — 공기감이 나머지보다
  5dB 더 어둡고 루프도 하위다. 2번은 159 BPM에 박 0.636이라 타이틀 화면에 맞지 않는다.
- **alley → 7·8번.** 둘 다 87.00 BPM이고 빌드가 평평하다. 9번은 루프 0.839가 가장 좋지만
  빌드 +4.9dB라 곡 자체가 부풀어 탈락이다.

최종 판단은 귀로 한다. 위 표는 들어볼 개수를 10개에서 5개로 줄이는 용도다.

#### 앞서 기록했던 1번 측정값은 철회한다

한때 1번을 "루프 상관 0.935, 크로스페이드가 들리지 않는다"고 적었다. **측정 도구의
버그였다.** 두 가지가 겹쳤다.

**대역을 자기 상한 아래에서 재고 있었다.** `ffmpeg`는 `-af` 필터를 소스 레이트로 걸고
**그 다음에** `-ar`로 리샘플한다. 대역 필터를 통과시킨 뒤 11025Hz로 내리면 Nyquist가
5.5kHz라 8~16kHz 통과대역은 전부 사라지고 필터 저지대역 누설만 남는다. 공기감이 항상
-45~-53으로 나온 것이 그 누설이다. 대역 측정만 44100Hz로 분리해 고쳤다.

**루프 탐색에 레벨 조건이 없었다.** 꼬리 페이드는 본체와 같은 소재를 작게 연주한
것이므로 상관이 높게 나온다. 그래서 게이트 없는 탐색은 레벨이 12dB 떨어지는 이음매를
1등으로 돌려준다. 1번의 0.935도 레벨차 -4.84dB 지점이었고, 5번은 -12.47dB 지점을
골랐다. `±1.5dB` 안에 드는 후보만 상관으로 줄 세우도록 고쳤다. 1번의 실제 값은
**0.372**다.

**교훈은 도구가 아니라 절차다.** 문서에 남아 있던 city의 루프 0.576과 공기감 -32.9는
브라우저 `OfflineAudioContext`로 잰 값이고 위 표는 `measure-track.mjs`로 잰 값이라
**애초에 같은 축이 아니었다.** 서로 다른 방법으로 얻은 숫자를 한 표에 나란히 놓은 것이
잘못이다. 앞으로 비교는 한 도구로 다시 잰 값끼리만 한다.

### title / alley

`title`은 city 확정 후, `alley`는 city 결과물을 듣고 무엇을 무너뜨릴지 정한 뒤에 작성한다.
특히 `alley`는 새로 뽑지 말고 city를 레퍼런스나 extend로 물려서 변형한다. 주제가 이어져야
"세계의 변질"이 성립한다.

### underground / inferno / return 프롬프트

**기획서와 배경을 같이 놓고 시작했다.** 스테이지 1에서 배운 것이 "배경과 어긋난 정서를
지시하면 프롬프트 안에서 태그끼리 싸운다"였고, 이 문서에 있던 한 줄짜리 방향성은
**기획서를 줄이는 과정에서 가장 중요한 단어를 하나씩 흘리고 있었다.**

| 스테이지 | 이 문서에 있던 요약 | 기획서 핵심 정서 | 흘린 것 |
| --- | --- | --- | --- |
| 3 지하도시 | 답답함 · 형광등 험 | 답답함, **상실감**, **너무 늦게 도착했다는 감각** | 상실감. 아래 참고 |
| 4 지옥 | 분노 · 폭주 | 공포보다 분노가 앞서는 폭주. **도시와 지하도시의 기억이 악마적 형태로 뒤틀린 공간** | 파생 관계. 아래 참고 |
| 5 천국 | 과노출된 불편한 아름다움 | 아름답지만 불편한 광기. **피해와 죽음조차 즐겁게 보인다** | 쾌감. 아래 참고 |

배경 실물도 확인했다. 3은 초록 안개 낀 지하 판자촌에 좌판 · 널린 빨래 · 화분이 남아 있고,
4는 용암 폭포와 붉은 하늘, 5는 흰빛으로 날아간 하늘과 금빛 신전이다. **4와 5는 기획서와
배경이 일치한다.**

#### 3스테이지는 압박이 아니라 상실이다

이 문서의 요약은 "답답함 · 형광등 험"이었는데 기획서 원문은 **"답답함, 상실감, 너무 늦게
도착했다는 감각"**이다. 적/오브젝트 항목에는 침구, 약병, **아이 그림**, 생존자 명단이
적혀 있다.

**형광등을 부정하는 것이 아니다.** 형광등은 기획서의 비주얼 팔레트 항목이고 배경에도 맞다.
음악의 중심 소재로 삼지 않을 뿐이다. 50/60Hz 험은 **무기물의 소리**여서, 깔면 압박은
생기지만 상실감은 생기지 않는다. 아이 그림이 걸려 있는 방의 소리가 아니다.

**"너무 늦게 도착했다"가 이 곡의 전부다.** 이건 공포가 아니라 애도다. 스테이지 1의 공포가
"세상은 멀쩡한데 내가 여기 있으면 안 된다"였다면 여기는 "내가 왔을 때 이미 끝나 있었다"이다.

그래서 이 곡은 **첼로가 처음으로 노래해도 되는 유일한 곡**이다. city는 텅 빈 밝음이었고
alley는 뒤틀림이었으므로 둘 다 선율을 허용하지 않았다. 여기서는 선율이 곧 사람의 흔적이고,
애도에는 부를 대상이 있어야 한다.

다만 alley에서 도착한 아포칼립스를 되돌리지는 않는다. **온기는 남아 있는 것이지 살아 있는
것이 아니다.** 현악은 따뜻하되 화성은 alley보다 더 내려앉힌다.

#### 조성 설계 — 다섯 곡이 전부 D다

| 곡 | 조성 | BPM | 의도 |
| --- | --- | --- | --- |
| `title` | D major | 없음 | 밝고 정적. 아직 아무 일도 안 일어났다 |
| `city` | D major / D lydian | 88 | 밝지만 착지하지 않는다 |
| `alley` | D minor | 88 | 같은 으뜸음에서 장조 → 단조. 같은 도시가 뒤틀린 것 |
| **`underground`** | **D phrygian** | **80** | 단조의 ♭2. 같은 D인데 한 칸 더 주저앉는다. 템포를 늦춰 걸음이 무거워진다 |
| **`inferno`** | **D minor** | **112** | **조성은 alley와 같고 속도와 음색만 올린다.** 지옥이 새 세계가 아니라 같은 세계의 끝이라는 뜻 |
| **`return`** | **D major** | **88** | city의 조성으로 돌아온다. THE RETURN이라는 이름 그대로다. 다만 이번엔 그 밝음이 잘못됐다는 것을 알고 듣는다 |

으뜸음을 D로 고정하면 **조성만으로 서사가 읽힌다.** 밝다 → 뒤틀린다 → 주저앉는다 →
타오른다 → 돌아온다, 그런데 돌아온 곳이 틀렸다. 같은으뜸조 전환이 city → alley에서
통했던 이유가 그대로 확장된다.

`inferno`에서 조성을 새로 바꾸지 않은 것이 이 설계의 핵심이다. 지옥에 새 조성을 주면
**세계가 하나 더 생긴다.** 우리가 말하려는 것은 같은 세계가 끝까지 간 것이다.

#### 편성은 그대로 간다

현악(첼로 · 비올라 중심) + 일렉기타. 팀 합의 사항이므로 지옥에서 브라스로, 천국에서
합창으로 빠지지 않는다. **가장 손쉬운 카드가 그 둘인데, 한 곡이라도 편성을 벗어나면 다섯
곡이 한 작품으로 들리지 않는다.** 프롬프트에 `brass-free` / `choir-free`를 명시한 이유가
이것이다.

**딱 하나 `return` B안에서만 합창을 열어 본다.** 천국 연출에서 합창이 실제로 얼마나 강한
카드인지는 들어봐야 알고, 그때 편성 합의를 바꿀지는 사람이 정한다. 실험이라는 것을
알고 뽑는 것과 모르고 새는 것은 다르다.

#### sparse는 3~5에서 더 중요하다

`sparse` 계열은 어떤 경우에도 빼지 않는다는 원칙이 여기서 더 세진다. **3~5는 전투 밀도가
1~2보다 높고, 특히 5스테이지는 공중전(`MovementMode.FLIGHT`)이라 총소리가 거의 끊기지
않는다.** 지옥이 격렬해야 한다고 해서 밀도를 올리면 그 자리에 총소리가 들어갈 곳이 없다.

**격렬함은 밀도가 아니라 음색으로 낸다.** 디스토션과 저역으로 만들고 악기 수는 늘리지
않는다. 어차피 악기를 늘리면 후반 상승이 따라오므로 루프도 같이 깨진다.

#### 3스테이지 곡은 갑자기 멈춰도 되는 곡이어야 한다

스테이지 3에는 `endEvent: 'siege'`가 붙어 있다. 기획서상 **암전 후 총성과 금속 충돌음만
재생하는 구간**이고, 화면이 없으므로 사운드가 연출의 전부다. 이때 브금이 계속 깔려 있으면
연출이 통째로 죽는다.

곡 설계에 걸리는 조건은 하나다. **어디서 끊어도 어색하지 않아야 한다.** 프롬프트가 이미
요구하는 "여덟 마디 반복 · 시종 같은 레벨"이 그대로 이 조건이기도 하므로 추가로 넣을
문장은 없다. 다만 **컷할지 페이드아웃할지는 `AudioDirector` 작업**이고 아직 손대지 않았다.

#### underground

**A — 첼로가 선율을 든다**

```
dark warm orchestral ambient, low cello playing a slow mournful melody, viola
sustaining underneath, clean electric guitar with long reverb sounding single
notes that decay into silence, damp and enclosed as if played in a low concrete
room, percussion-free, spacious and sparse, empty and abandoned, an elegy for
people who are already gone, the feeling of arriving too late, warmth left
behind in a place where nobody remains, purely instrumental, one continuous
unchanging texture, the same handful of instruments from beginning to end, the
same eight bars repeated over and over for the entire duration, the final
section sits at exactly the same level as the opening, starts immediately at
full level, loopable background bed, 80 BPM, D phrygian
```

**B — 공간으로 프레이밍**

title A/B에서 "녹음물로 프레이밍"이 구조 만들기를 억제하는 데 효과가 있었으므로 같은
수를 쓴다. 여기서는 공간 자체가 정서를 만든다.

```
a slow cello lament recorded in a large underground concrete space, viola and
double bass sustaining a low drone underneath, one clean electric guitar note
every few bars fading into the room, heavy damp air, muffled and enclosed,
percussion-free, mournful and still, the sound of a place people have left,
grieving for something that ended before anyone arrived, nothing enters and
nothing leaves, purely instrumental, the same eight bars
repeated over and over for the entire duration, starts immediately at full
level, loopable background bed, 80 BPM, D phrygian
```

#### inferno는 새 곡이 아니라 기억이다

기획서가 지옥을 **"도시와 지하도시의 기억이 악마적 형태로 뒤틀린 공간"**으로 정의한다.
장소가 아니라 기억이라는 것이 결정적이다. **alley가 city의 변질이었던 것과 정확히 같은
관계를 한 번 더 쓰라는 뜻이다.**

`alley`를 만들 때 세운 원칙이 그대로 적용된다. 새로 뽑지 말고 **앞 곡을 물려서 태운다.**
주제가 무관하면 "기억이 뒤틀렸다"가 성립하지 않고 그냥 별개의 지옥 스테이지가 된다.

조성을 alley와 같은 D minor로 둔 이유도 여기 있다. **새 조성을 주면 세계가 하나 더
생긴다.** 우리가 말하려는 것은 같은 세계가 끝까지 간 것이다.

#### inferno

**A — 기타가 앞이다**

```
heavy dark orchestral, the same brooding D minor material from a back alley
piece now burning and distorted, distorted electric guitar riff grinding low and
steady, low cello and viola sawing in unison with the guitar, driving drum kit
with a relentless kick and snare pattern audible throughout, brass-free, hot and
overdriven, furious and unrelenting, spacious and sparse, purely instrumental,
one continuous unchanging texture, the same handful of instruments from
beginning to end, the same eight bars repeated over and over for the entire
duration, the final section sits at exactly the same level as the opening,
starts immediately at full level, loopable background bed, 112 BPM, D minor
```

**B — 현악이 앞이다**

분노가 기타에서 나오느냐 관현악에서 나오느냐를 가르는 대조다. 편성은 같고 순서만 바뀐다.

```
furious string orchestra, a half-remembered melody from an earlier darker piece
torn apart and played too fast, low cello and viola playing fast repeated
tremolo figures, distorted electric guitar doubling them an octave below,
driving drum kit with a relentless kick and snare pattern audible throughout,
brass-free, molten and overdriven, the same rage held at one level and never
peaking, sparse, purely instrumental, the same handful of instruments from
beginning to end, the same eight bars repeated over and over for the entire
duration, starts immediately at full level, loopable background bed, 112 BPM,
D minor
```

**둘 다 안 되면 `alley` 채택본을 레퍼런스로 물린다.** 문장으로 파생을 지시하는 것이
한계에 부딪히면 그때는 city → alley에서 쓰려던 수를 그대로 꺼낸다.

`never peaking`은 `never building to a climax`와 같은 자리를 노린 문장이다. 분노는
정의상 고조되려 하므로 이 곡이 다섯 중 후반 상승이 가장 나올 만하다. **측정에서 제일 먼저
볼 항목이 여기서는 다이내믹이다.**

#### return은 city의 재탕이 아니다 — 이번엔 즐기고 있다

기획서의 천국 정서는 "아름답지만 불편한 광기"에서 끝나지 않고 **"피해와 죽음조차 즐겁게
보인다"**로 이어진다. 같은 화면에서 주인공은 안광과 미소를 하고 있고, 외형 변화표의
5스테이지 항목은 **"광기, 전투 쾌감, 현실의 완전한 왜곡"**이다.

**이 차이가 city와 갈리는 지점이다.** city는 밝은 세계를 불편하게 바라보는 곡이었고
플레이어는 관찰자였다. return에서 플레이어는 그 안에 들어가 있고 즐기고 있다. 관찰자의
불편함을 한 번 더 쓰면 **곡이 city의 재탕이 되고, 서사에서 가장 멀리 온 지점이 가장 익숙한
소리로 들린다.**

그래서 이 곡만 **고양돼 있어야 한다.** 문제는 그것이 "후반 상승 금지"와 정면으로 부딪힌다는
것이다. 고양을 레벨로 만들면 루프가 깨진다.

**해법은 고양을 세로로 쌓는 것이다.** 처음부터 끝까지 같은 크기로, 다만 음역을 위로 몰고
화성을 계속 위로 열어 둔다. 크기가 아니라 높이로 도취를 만들면 루프가 살아남는다.

#### return

**A — 편성 합의 유지**

```
blindingly bright orchestral, high register strings soaring and overexposed,
ecstatic and radiant, glassy shimmering textures pushed past comfort,
crystalline clean electric guitar arpeggio with heavy reverb, light cello
underneath, choir-free, rapturous in a way that should not feel good,
unresolved suspended chords that keep opening upward and never settle, too
beautiful to trust, spacious and sparse, purely instrumental, one continuous
unchanging texture, the same handful of instruments from beginning to end, the
same eight bars repeated over and over for the entire duration, the final
section sits at exactly the same level as the opening, starts immediately at
full level, loopable background bed, 88 BPM, D major
```

**B — 합창을 열어 보는 실험**

`purely instrumental`을 뺀 유일한 프롬프트다. 뺀 자리에 가사가 딸려 오지 않도록
**"단어를 부르지 않는다"를 긍정형으로 명시**한다.

```
overexposed bright orchestral, high register strings soaring, a distant wordless
choir far behind them holding vowels and singing no words, glassy shimmering
textures, crystalline clean electric guitar arpeggio, light cello underneath,
ecstatic and washed out, rapturous in a way that should not feel good,
unresolved suspended chords that keep opening upward and never settle, spacious
and sparse, one continuous unchanging texture, the same handful of instruments
from beginning to end, the same eight bars repeated over and over for the entire
duration, the final section sits at exactly the same level as the opening,
starts immediately at full level, loopable background bed, 88 BPM, D major
```

#### 일정이 곡 수를 정한다 — 우선순위는 3 → 4 → 5

기획서의 공통 작업 규칙에 **8월 5일부터 신규 기능 제한, 8월 7일부터 치명적 버그만 수정**이
걸려 있다. 브금 추가는 신규 기능이므로 **실질 마감이 8월 4일**이다.

동시에 사운드는 MVP 표에서 **SHOULD**이고 완료 기준이 "BGM 3~5개 또는 분위기별 루프,
필수 효과음 / 무음 구간 없이 타격감 확보"다. **`title`·`city`·`alley` 세 곡으로 최소선은
이미 충족돼 있다.** 지금 하는 일은 3~5개 구간의 위쪽을 채우는 것이지 미달을 메우는 것이
아니다.

따라서 셋을 다 못 넣더라도 게임은 기준을 만족한다. **순서만 지키면 된다.**

| 순위 | 큐 | 근거 |
| --- | --- | --- |
| 1 | `underground` | 모든 플레이어가 지나간다. 4·5는 이탈자가 도달하지 못할 수 있다 |
| 2 | `inferno` | 정서 낙차가 가장 크다. 여기서 alley가 계속 흐르면 지옥이 뒷골목처럼 들린다 |
| 3 | `return` | 없을 때 대체가 가장 자연스럽다. `title`이 같은 D major라 급하면 그것으로 버틴다 |

#### 지금 스테이지 3~5는 무음이다 — 폴백이 없다

곡이 빠져도 직전 곡이 이어질 것이라 생각했는데 **코드를 읽어 보니 아니다.**

`playMusic`은 `stopMusic()`을 먼저 부르고 그 다음에 `startMusic()`을 부른다.
`startMusic()`은 `isLoaded(key)`가 거짓이면 그대로 돌아온다. 그래서 파일 없는 큐로
전환하면 **직전 곡이 죽고 아무것도 시작되지 않는다.**

```
playMusic('bgm-underground')
  → stopMusic()      직전 곡 정지 · 파기
  → startMusic()     isLoaded 실패로 즉시 반환
  = 무음
```

SFX가 파일 없는 큐를 조용히 건너뛰는 것과는 다른 동작이다. 효과음은 안 울리고 끝이지만
브금은 **이미 울리던 것을 끄기 때문이다.**

**이것은 MVP 완료 기준의 "무음 구간 없이"와 정면으로 충돌한다.** 지금 빌드는 3스테이지에
진입하는 순간부터 엔딩까지 브금이 없다.

두 가지 중 하나를 해야 한다.

| 방법 | 내용 | 비용 |
| --- | --- | --- |
| 곡을 다 만든다 | 아래 프롬프트대로 3곡을 8월 4일까지 채운다 | 생성 · 선별 · 가공 3회 |
| **폴백을 넣는다** | `startMusic()`이 실패할 곡이면 `stopMusic()`을 하지 않는다. 직전 곡이 계속 흐른다 | `playMusic` 몇 줄 |

**폴백은 곡을 다 만들더라도 넣는 편이 낫다.** 파일이 늦게 도착하는 경우에도 같은 무음이
생기기 때문이다. 다만 이건 오디오 코드 작업이고 곡 작업과 독립이므로 순서를 다투지 않는다.

#### 생성 기록

뽑는 대로 채운다. 비어 있는 것은 아직 생성하지 않았다는 뜻이다.

| 순서 | 큐 | 프롬프트 | 길이 | 제목 |
| --- | --- | --- | --- | --- |
| | | | | |

### 브금은 부팅을 막지 않는다

`BootScene`이 오디오를 전부 받은 뒤에야 타이틀 화면을 띄우던 구조였다. 문제는 비중이다.

| | 크기 |
| --- | --- |
| SFX 9개 합계 | 113 KB |
| `bgm-city` 하나 | 3,932 KB (가공 전) |

**타이틀이 뜨기까지 받아야 하던 4.0MB 중 97%가 브금이었다.** 느린 회선에서는 그동안 빈
화면을 본다. 그리고 `title`, `alley`, 스테이지 3~5 브금이 붙으면 전부 이 대기에 쌓인다.

그래서 **효과음만 부팅을 막고 브금은 뒤에서 받는다.** 대기가 113KB로 줄고, 앞으로 브금을
몇 개를 더 넣든 첫 로딩 시간은 그대로다.

- `BootScene`은 `MUSIC_CONFIG`에 있는 키를 건너뛴다
- `AudioDirector.requestMusic()`이 `fetch` 후 `sound.decodeAudio()`로 캐시에 넣는다
- 파일이 도착하기 전에 스테이지가 시작되면 **원하는 곡을 기억해 두었다가**
  `Phaser.Sound.Events.DECODED`가 오면 그때 재생한다. 그 사이에 다른 스테이지로
  넘어갔으면 늦게 도착한 곡은 버린다

**받는 대상은 지금 필요한 곡과 그 다음 스테이지 곡뿐이다.** 처음에는 존재하는 브금을
전부 받았는데, 곡이 6개가 되면 1스테이지에서 그만두는 플레이어도 5~6MB를 전부 내려받게
된다. 게다가 그 전송이 **플레이어가 실제로 기다리고 있는 1스테이지 배경과 대역폭을
나눠 먹는다.**

반대로 스테이지가 바뀔 때 그 곡만 받으면 전환마다 1초 안팎의 무음이 생긴다. 그래서 한 칸
앞서 받는다. 리드타임이 스테이지 체류 시간(2~3분)인데 한 곡은 1초 남짓이라 무음 갭이
생길 여지가 없다.

| 방식 | 부팅 시 | 무음 갭 | 1스테이지 이탈자 |
| --- | --- | --- | --- |
| 전량 선반입 | 5~6MB | 없음 | 전곡 |
| 온디맨드 | 1곡 | 전환마다 ~1초 | 1~2곡 |
| **현재 + 다음** | **1~2곡** | **없음** | **2~3곡** |

**배경 이미지도 같은 규칙을 따르기로 했다.** 오디오와 이미지가 다른 규칙으로 움직이면
어느 시점에 무엇이 받아지는지 아무도 예측하지 못한다.

타이틀 화면에서 1스테이지 곡을 미리 받아 둔다. 플레이어가 안내를 읽고 ENTER를 누르는
그 구간이 1스테이지 곡에게 주어지는 유일한 여유다.

Phaser의 씬 로더 대신 사운드 매니저로 디코딩하는 이유는, **boot → title → game 핸드오버를
넘겨 살아남는 씬이 없기 때문이다.** 한 씬에서 시작한 로더는 그 씬과 함께 정리된다.

`decodeAudio`는 Web Audio 매니저에만 있다. HTML5나 무음 매니저로 떨어지면 브금은 조용히
빠지는데, 이는 파일이 없는 큐가 조용히 넘어가는 기존 동작과 같다.

프로덕션 빌드 실측:

```
BGM  fetch           3,932 KB   요청 1건, 로더 밖
SFX  xmlhttprequest    113 KB   9건, 부팅 로더
```

### 점검 도구

`tools/measure-track.mjs`가 후보 한 곡을 네 지표로 잰다. ffmpeg는 디코딩에만 쓰고 계산은
전부 스크립트 안에서 하므로 실행마다 값이 흔들리지 않는다.

```bash
node tools/measure-track.mjs <파일> [--loop-from <초>]
```

| 지표 | 무엇을 보는가 |
| --- | --- |
| 빌드 | 앞뒤 레벨 차이. 곡이 커지면 루프 이음매가 레벨 점프가 된다 |
| 박 | 온셋 자기상관. 큐에 따라 있어야 하기도 하고 없어야 하기도 하다 |
| 대역 | 8~16kHz가 스테이지 1을 유리처럼 들리게 하는 성분이다 |
| 루프 | 두 끝의 소재가 얼마나 닮았는지. 크로스페이드가 들리는지를 결정한다 |

윤곽도 함께 출력하므로 인트로 빌드나 후반 크레셴도의 모양을 눈으로 확인할 수 있다.

두 곳에 함정이 있어 코드에 주석으로 박아두었다. **대역은 44100Hz로 따로 디코딩한다** —
`ffmpeg`가 필터를 먼저 걸고 리샘플하므로 다른 지표용 11025Hz로 재면 8~16kHz가 통째로
사라진 자리에 저지대역 누설만 남는다. **루프는 레벨차 ±1.5dB 안의 후보만 줄 세운다** —
꼬리 페이드는 본체와 같은 소재를 작게 연주한 것이라 상관이 높게 나오고, 게이트가 없으면
레벨이 10dB 넘게 떨어지는 이음매가 1등이 된다. 조건에 드는 후보가 없으면 그렇다고 함께
출력한다.

**박이 탐색 하한 60에 붙어 나오면 경계에 걸린 것일 수 있다.** alley 6번이 60.00으로
나왔는데 하한을 35로 넓히면 44.75(89.5의 절반)였다. 60이나 180이 나오면 범위를 넓혀
다시 확인한다.

`tools/audio-check.html`을 브라우저로 열고 음원을 끌어다 놓으면 아래 규격을 자동으로
대조한다. 설치할 것은 없고 파일 하나로 동작한다. 여러 개를 한 번에 놓으면 **후보 비교표**가
뜨고 각 행에서 바로 재생할 수 있다.

기본 화면은 **말로** 보여준다. 곡을 고르는 사람이 믹싱 엔지니어일 필요는 없다.

| 항목 | 표시 | 뜻 |
| --- | --- | --- |
| 밝기 | 밝음 / 보통 / 어두움 | 밝은 도시 배경과 어울리는가 |
| 곡의 변화 | 거의 일정 / 조금 움직임 / 기복이 큼 / 뒤로 갈수록 커짐 | 루프로 돌려도 티가 안 나는가 |
| 총소리와 궁합 | 잘 비켜줌 / 보통 / 총소리와 겹침 | 전투 중 총소리를 덮지 않는가 |
| 손볼 것 | 앞뒤 몇 초를 자를지, 음량을 낮출지 | 가공 단계에서 할 일 |

**자세한 수치**를 펼치면 원래 측정값이 나온다. 길이 · 샘플레이트 · 채널 · 피크와 클리핑 ·
앞뒤 페이드 · 후반 상승과 구간 편차 · 루프 이음매 · 공기감(8~16kHz) · 중역(1~4kHz) ·
추정 BPM.

판정에서 **페이드와 음량은 감점하지 않는다.** 언제든 잘라내고 조정할 수 있기 때문이다.
합격 여부를 가르는 것은 밝기와 곡의 변화다.

비교표에는 **전체 / 추천** 전환이 있다. 기본은 **전체**이고, 추천은 측정 기준을 통과했다는
뜻일 뿐이다. **기준을 놓친 테이크가 듣기에 더 좋을 수 있으므로 기본 화면에서는 아무것도
감추지 않는다.**

**플레이어는 페이지 전체에 하나다.** 비교표에서 행을 고르거나 `▶ 듣기`를 누르면 그 곡이
아래 상세 패널에 올라오고, 같은 플레이어가 곡만 바꿔 재생한다. 후보가 열둘이어도 플레이어를
찾아 헤맬 일이 없고, A/B 비교는 행을 번갈아 누르는 것으로 끝난다.

대역과 레벨 측정값은 **앞뒤 페이드를 제외한 구간에서, 각 곡의 평균 레벨을 기준으로** 낸다.
그래서 마스터 볼륨이 다른 두 테이크도 그대로 비교할 수 있다.

귀로 판단할 항목(좋게 들리는가, 화면에 맞는가)은 다루지 않는다. 눈으로 봐야 빠른 것만 본다.

### 생성 후 반드시 처리할 것

- **앞뒤 페이드 제거.** 프롬프트로는 완전히 막지 못한다. 페이드가 걸려 있으면 루프가
  성립하지 않으므로 마디 경계에서 잘라낸다.
- **루프 이음매.** AI는 루프용으로 뽑아주지 않는다. 마지막 마디와 첫 마디에 크로스페이드를
  걸어 끊김이나 클릭 노이즈를 없앤다. 길이보다 이음매가 먼저 들킨다.
- **길이 60초~3분.** 3분이면 스테이지를 통과하는 동안 거의 반복되지 않는다.
- **포맷 변환 불필요.** mp3·wav 그대로 넣어도 인식된다.
- **라이선스 확인.** Lyria 출력물에는 SynthID 워터마크가 들어가고, 접근 경로(MusicFX /
  Vertex AI / Gemini API)마다 상업 이용 범위 약관이 다르다. 라이선스 대장에
  `AI 생성 / 서비스명 / 접근 경로 / 약관상 이용 범위`를 반드시 기록한다.

## 나중에 필요한 큐

아래는 대응하는 기능이 아직 구현되지 않아 붙일 곳이 없다. 위 12개를 먼저 채운다.

| 시점 | 필요한 사운드 |
| --- | --- |
| 스테이지 3~5 | BGM 3개 — 지하도시(답답함·형광등 험), 지옥(분노·폭주), 천국(과노출된 불편한 아름다움) |
| 강화 3택 1 | 카드 hover, 선택 확정음 |
| 3스테이지 포위 | **암전 후 총성과 금속 충돌음만 재생**(기획서 명시). 화면이 없으므로 사운드가 연출의 전부인 구간 |
| 3→4 낙하 | 풍절음, 바닥 충돌 |
| 4→5 균열 | 유리 깨짐, 플래시 |
| 엔딩 | 드론 스캔음, "미약한 생체 신호를 확인했습니다" 음성 |
| 최종 보스 | 패턴 3종 발사음, 피격, 격파 |

## 파일 적용 방법

**받은 파일을 폴더에 넣기만 하면 된다.** 코드 수정도, 매니페스트 갱신도 없다.

- BGM → `client/src/assets/audio/music/`
- SFX → `client/src/assets/audio/sfx/`

### 이름 규칙

파일명이 **큐 이름으로 시작하기만** 하면 된다. 대소문자·구분자·확장자는 자유.

| 큐 | 붙는 파일명 예시 |
| --- | --- |
| `sfx-smg-fire` | `smg-fire.ogg` / `smg_fire_01.wav` / `SMG Fire.mp3` |
| `bgm-city` | `city.ogg` / `city_loop_v2.wav` |

지원 확장자는 `.ogg .mp3 .wav .m4a .webm`. 비교할 때 소문자로 바꾸고 영숫자만 남기므로
`SMG Fire_01.wav` → `smgfire01`이 되어 `smgfire`로 시작하는 것으로 판정된다.
후보가 여럿이면 이름이 가장 짧은(=가장 정확한) 파일이 이긴다.

파일이 어느 큐에도 안 붙으면 dev 콘솔이 알려준다:

```
[audio] 2 cue(s) still have no file: bgm-title, bgm-alley
[audio] file(s) matched no cue, check the name: sfx/gunshot.wav
```

이러면 `gunshot.wav`를 `smg-fire.wav`처럼 큐 이름으로 시작하게 바꾸면 된다.

### 동작 원리

Vite가 빌드 시점에 폴더를 훑어(`import.meta.glob`) **실제 존재하는 파일만** 로드 목록에
넣는다. 없는 큐는 요청 자체를 안 하므로 404도, 예외도 없다. 파일이 없는 큐는
`AudioDirector`가 조용히 건너뛰므로 음원이 하나도 없어도 게임은 처음부터 끝까지 돌아간다.

> `vite.config.ts`의 `soot:missing-assets-404` 플러그인은 남겨둘 것. dev 서버는 없는
> 경로에 `index.html`을 200으로 돌려주기 때문에, `public/`의 에셋 경로를 오타내면
> Phaser가 마크업을 디코딩하다 죽는다. 이 플러그인이 제대로 404를 반환해서 그걸 막는다.

## 음원 수급

현재 방침은 **SFX는 무료 에셋 수급, BGM은 AI 생성**이다.

CC0(퍼블릭 도메인) 우선. CC-BY는 크레딧 표기 부담이 있으니 대안이 없을 때만 쓴다.

- **Kenney** (kenney.nl) — 전량 CC0. UI/임팩트/SF 계열 사운드팩이 있어 기본 SFX 채우기에 가장 빠르다
- **Freesound** (freesound.org) — 라이선스 필터에서 CC0만 걸러서 검색
- **OpenGameArt** (opengameart.org) — CC0 필터 존재. 게임용으로 정리돼 있음
- **Sonniss GDC 번들** — 상업 이용 가능한 무료 SFX 대용량 배포. 라이선스 문구 확인 후 사용

받을 때마다 아래 라이선스 대장을 즉시 채운다. 검색 페이지의 라이선스 표기와 실제 파일
페이지의 표기가 다른 경우가 있으니 **개별 파일 페이지 기준**으로 확인한다.

## 큐 추가 절차

1. `audioConfig.ts`의 `SfxKey`(또는 `MusicKey`)에 키 추가
2. `SFX_CONFIG`(또는 `MUSIC_CONFIG`)에 볼륨/지터/스로틀 추가 — 이 레코드가 곧 탐색 대상 목록이다
3. 대응하는 게임 이벤트가 없으면 `gameEvents.ts`의 `GameEventMap`에 추가하고 발생 지점에서 emit
4. `AudioDirector`에 핸들러 연결
5. 이 문서의 표 갱신

이벤트명은 개발자 간 계약이므로 이름 변경은 반드시 합의 후에 한다.

## 라이선스 대장

무료 에셋을 쓰는 경우 **받는 즉시** 이 표를 채운다. 제출 빌드에 출처 미상 에셋이 들어가면 안 된다.

| 에셋 키 | 파일 | 출처 | 라이선스 | 저작자 표기 필요 | 표기 문구 |
| --- | --- | --- | --- | --- | --- |
| `bgm-title` | `title_sunlight-through-a-pane.ogg` | Gemini 웹 앱(gemini.google.com)의 Lyria 3 Pro로 생성, Google AI Pro 구독 | 잼 제출 가능 / 상업 이용 미보장 (아래 참고) | 불필요 | |
| `bgm-city` | `city_the-center-of-the-room.ogg` | 〃 | 〃 | 불필요 | |
| `bgm-alley` | `alley_the-unsteady-corridor.ogg` | 〃 | 〃 | 불필요 | |
| `sfx-smg-fire` | `smg-fire_synth-dry.wav` | 자체 제작 (`tools/make-gunshot.mjs`) | 해당 없음 | 불필요 | |
| `sfx-shotgun-fire` | `shotgun-fire_laser-large-000.ogg` | Kenney — Sci-Fi Sounds 1.0 | CC0 1.0 | 불필요 (권장) | 〃 |
| `sfx-enemy-hit` | `enemy-hit_impact-metal-medium-004.ogg` | Kenney — Impact Sounds 1.0 | CC0 1.0 | 불필요 (권장) | 〃 |
| `sfx-enemy-down` | `enemy-down_explosion-crunch-000.ogg` | Kenney — Sci-Fi Sounds 1.0 | CC0 1.0 | 불필요 (권장) | 〃 |
| `sfx-player-hit` | `player-hit_impact-punch-medium-001.ogg` | Kenney — Impact Sounds 1.0 | CC0 1.0 | 불필요 (권장) | 〃 |
| `sfx-player-dash` | `player-dash_phase-jump-2.ogg` | Kenney — Digital Audio | CC0 1.0 | 불필요 (권장) | 〃 |
| `sfx-player-death` | `player-death_low-frequency-explosion-001.ogg` | Kenney — Sci-Fi Sounds 1.0 | CC0 1.0 | 불필요 (권장) | 〃 |
| `sfx-room-locked` | `room-locked_impact-metal-004.ogg` | Kenney — Sci-Fi Sounds 1.0 | CC0 1.0 | 불필요 (권장) | 〃 |
| `sfx-room-cleared` | `room-cleared_impact-soft-heavy-000.ogg` | Kenney — Impact Sounds 1.0 | CC0 1.0 | 불필요 (권장) | 〃 |
| `sfx-monitor-beep` | `monitor-beep_synth.wav` | 자체 제작 (`tools/make-monitor-beep.mjs`) | 해당 없음 | 불필요 | 사인파 합성이라 원본 소재가 없다 |

**SFX는 전부 정리됐다.** 팩 3종의 `License.txt`를 직접 열어 확인했고 셋 다 CC0 1.0이며
개인·교육·상업 이용을 명시적으로 허용한다. 표기는 의무가 아니지만 크레딧에 한 줄
`Sound effects by Kenney (kenney.nl)`를 넣는 편이 낫다. 비용이 없다.

### 크레딧 화면은 아직 없다 — 제출 전 만들어야 한다

**표기할 것은 정해졌는데 표기할 자리가 없다.** `TitleScene`은 `SOOT`와 `PRESS ENTER` 두 줄이
전부이고 게임 중 UI는 HUD뿐이라, 지금 저장소 어디에도 크레딧 문자열이 없다.

**별도 크레딧 화면이 필요할 것으로 본다.** 타이틀 하단 한 줄로 처리하기에는 적을 대상이
오디오 밖까지 걸친다.

| 대상 | 표기 의무 | 적을 내용 |
| --- | --- | --- |
| SFX (Kenney 팩 3종) | 없음 (권장) | `Sound effects by Kenney (kenney.nl) — CC0 1.0` |
| BGM 3곡 | 없음 | Gemini 앱 Lyria로 생성했다는 사실. 의무는 아니지만 SynthID 워터마크가 어차피 파일에 남아 있으므로 숨길 것이 아니다 |
| 자체 합성 SFX 2개 | 없음 | `smg-fire`, `monitor-beep`. 자체 제작이라 표기할 제3자가 없다 |
| 스프라이트 · 배경 | 없음 | **팀 자체 제작.** 에셋 커밋 작성자는 `Jii-Yeong`. 크레딧의 본래 목적이 제작자를 적는 것이므로 여기서는 빼지 않는다 |

**표시할 이름은 아직 정하지 않았다.** 실명인지 핸들인지가 정해져야 문구를 확정할 수 있다.

### BGM 라이선스 — 확인한 것과 남은 위험

Gemini 앱 Lyria로 만든 곡의 상태를 조사한 결과다. **결론부터: 잼 제출에는 문제가 없고,
상업화하려면 여러 칸이 비어 있다.**

| 항목 | 상태 |
| --- | --- |
| 소유권 | Google이 주장하지 않음. 일반 약관에 "Google won't claim ownership over that content" |
| 저작자 표기 | 불필요 |
| 상업 이용 **명시적 허가** | **없음.** Google 문서에서 "Commercial use rights"가 적힌 곳은 별도 제품인 Google Flow Music뿐 |
| IP 배상 | **없음.** 소비자용 Gemini 앱은 대상이 아니고 Vertex AI 엔터프라이즈만 해당 |
| 한국 내 저작권 등록 | **불가.** 아래 참고 |
| SynthID 워터마크 | 전 출력에 삽입. 압축·포맷 변환에도 남으므로 우리 Ogg 변환 후에도 유지 |
| 진행 중 분쟁 | 독립 뮤지션들이 Lyria 3 학습 데이터를 두고 Google을 상대로 소송 제기 |

**한국 기준이 가장 명확하다.** 저작권법이 저작물을 "인간의 사상이나 감정을 표현한 창작물"로
정의하므로 순수 AI 생성물은 보호 대상이 아니다. 문화체육관광부와 한국저작권위원회의 2025년
생성형 AI 저작권 등록 안내에 따르면 **프롬프트 입력만으로는 창작적 기여로 인정되지 않고**,
사람이 결과물을 실질적으로 수정하거나 독자적인 작곡을 더해야 보호된다. 판단 기준은
**제어 가능성과 예측 가능성**이다. 음저협은 2025년 3월부터 AI 활용 신고 곡에 등록 유보를
적용하고 있다.

우리가 한 가공(루프 구간 선정, 크로스페이드, 정규화, 코덱 변환)은 **수정이지 작곡이 아니다.**
따라서 이 곡들은 우리 저작물로 등록할 수 없다고 보는 것이 안전하다.

**그것이 사용을 막지는 않는다.** 등록 불가는 "독점권을 주장할 수 없다"는 뜻이고 "쓸 수 없다"는
뜻이 아니다. 무료 배포되는 잼 제출물에는 실질적 영향이 없다.

> **해커톤 규정 확인은 끝났다. 제출물 에셋의 소유권이나 권리 보유를 요구하는 문구가
> 규정에 없다.** 요구했다면 AI 생성 BGM이 조건을 만족하지 못했을 수 있고 그것은 약관
> 문제가 아니라 대회 규정 문제라 우리가 해결할 수 없었을 것이다. 규정이 침묵하므로
> 이 경로로 제출하는 데 남은 걸림돌은 없다.

상업화 이야기가 나오면 그때는 **Vertex AI로 다시 뽑는 것**이 답이다. 곡당 약 $0.08이고
상업 이용이 명시돼 있으며 배상까지 붙는다. 그 시점에는 곡이 어떤 소리여야 하는지 정확히
알고 있으므로 근접시키는 비용도 낮다.

직접 제작한 경우 출처에 `자체 제작`, 라이선스에 `해당 없음`으로 기록한다.

CC0 / CC-BY 여부를 반드시 확인하고, CC-BY면 표기 문구를 타이틀 화면 또는 크레딧에 넣어야 한다.
