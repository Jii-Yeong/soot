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

> **`sfx-player-hit` 복선.** 기획서에 "1~3 스테이지의 피격 순간에 병원 모니터 파형을 삽입"이
> 있다. 주인공이 사실 병원에 누워 있다는 힌트다. 피격음에 심전도 모니터음을 아주 작게 깔면
> 사운드만으로 복선이 성립한다. 파일 2개를 받아 겹쳐 재생하는 방식도 가능하다.

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

**`player-hit` 복선용 재료를 같이 받아 뒀다.** `candidates/sfx/monitor-tone_tone1.ogg`
(digital 팩 `tone1`, 0.661초). 심전도 모니터 비프에 가장 가깝다. `player-hit`가 저역에만
에너지가 있고 중역이 -25.8dB로 비어 있어 이 비프를 겹쳐도 서로 먹지 않는다. 겹쳐 재생은
`AudioDirector` 작업이 필요하므로 지금은 재료만 둔다.

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
| 2 | 공기감 8~16kHz | -24dB보다 위 | 밝은 도시 배경과 맞물린다 |
| 3 | 중역 1~4kHz | ~~-8dB보다 아래~~ **보류** | 실측이 아닌 추정치였고, 표본 11개가 도달 불가임을 보였다. 아래 항목 참고 |
| 4 | 앞뒤 페이드 | — | 항상 잘라내면 되므로 **이것으로 탈락시키지 않는다** |

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

최종 판단은 귀로 하고 그 귀가 한 사람일 필요는 없으므로, **뽑은 테이크는 전부 저장소에 남겨
두 사람이 같이 듣는다.** 측정값은 후보를 좁히는 데 쓰고 고르는 것은 사람이 한다.

| 위치 | 역할 |
| --- | --- |
| `client/src/assets/audio/candidates/<큐>/` | 그 큐로 생성한 모든 테이크. 원래 제목 그대로 둔다 |
| `client/src/assets/audio/music/`, `sfx/` | 현재 잠정 선택 하나. 파일명이 큐 이름으로 시작한다 |

후보는 큐별로 나눈다(`candidates/city/`, 뒤이어 `candidates/title/`, `candidates/alley/`).
한 폴더에 섞이면 어느 곡이 어느 큐 후보인지 알 수 없고, 점검 도구에서 폴더를 통째로 열 때도
관계없는 곡이 딸려 온다.

**SFX 후보만 예외로 `candidates/sfx/` 한 폴더를 같이 쓴다.** 큐가 9개인데 폴더를 9개
만들면 파일 하나짜리 폴더가 늘어날 뿐이다. 대신 **파일명을 `<큐>-<순위>_원본이름`으로**
둔다(`smg-fire-2_impactPlate_heavy_003.ogg`). 탈락시킨 것은 `-x`와 `_rejected`를 붙여
남긴다. 왜 안 되는지가 다음 선택의 근거가 된다.

`candidates/`는 **빌드에 포함되지 않는다.** `audioAssets.ts`의 글롭이 `music`과 `sfx`
두 폴더만 이름으로 지정하기 때문이다. 이 부분을 `*`로 되돌리면 탈락한 테이크 수십 MB가
제출 빌드에 그대로 실린다.

후보를 `music/`에 두면 안 되는 이유는 하나 더 있다. `city`로 시작하는 파일이 둘 이상이면
이름이 짧은 쪽이 자동 선택되므로 어느 것이 재생 중인지 알 수 없게 된다.

**듣고 비교하는 방법:** `tools/audio-check.html`을 더블클릭한다. **후보 목록이 바로 뜬다.**
고르는 것도 여는 것도 필요 없고 재생만 하면 된다.

측정 결과는 `tools/audio-candidates.js`에 저장돼 있다. 같은 파일이면 결과가 늘 같으므로 열
때마다 다시 분석하지 않는다. 브라우저는 로컬 파일을 **재생**할 수는 있고 **바이트를 읽을**
수는 없는데, 재생만 하면 되니 문제가 되지 않는다.

**새 테이크를 측정할 때는** dev 서버를 띄우고 `?src=` 에 파일 경로를 넘긴다. 분석이 끝나면
콘솔에 `[audio-check] manifest`가 찍히고, 그 내용을 `audio-candidates.js`의 `takes`에 붙여
넣으면 다음부터는 모두가 분석 없이 바로 듣는다. 이 과정은 오디오 담당이 처리하므로 곡을
고르는 쪽은 신경 쓸 필요가 없다.

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
| 1 | title | A | 180초 | The Glass Horizon |
| 2 | title | B | 170초 | — |
| 3 | title | C | 177초 | — |
| 4 | title | A | 170초 | Sunlight Through the Atrium |
| 5 | title | B | 179초 | Noon in the Atrium |
| 6 | alley | A | 167초 | Under the Iron Ceiling |
| 7 | alley | A | 130초 | The Unsteady Corridor |
| 8 | alley | B | 136초 | Gravity of the Concrete |
| 9 | alley | B | 127초 | The Warped Foundation |
| 10 | alley | C | 167초 | Torsion of the Girders |

**측정은 1번만 끝났다.** 크롬이 연속 다운로드를 막아 나머지 9개를 아직 받지 못했다.

| | 1번 (title A) | 참고: city 채택본 |
| --- | --- | --- |
| 빌드 | **-0.2 dB** | — |
| 루프 상관 | **0.935** | 0.576 |
| 박 상관 | 0.498 @ 80 BPM | 0.676 @ 88.5 |
| 공기감 8~16k | -53.4 | -32.9 |

**빌드가 사실상 0이다.** Pro의 구조 생성을 프롬프트로 이긴 첫 사례이고, BPM 제거와
`the same eight bars repeated over and over`가 효과였을 가능성이 크다. 루프 상관 0.935는
24초와 144초가 거의 같은 소재라는 뜻으로, 크로스페이드가 들리지 않는다.

남은 문제는 둘이다. **공기감이 city보다 20dB 낮아** 밝기 지시가 먹지 않았고, **박 상관
0.498**은 목표 0.3을 넘는다. `free time`, `no pulse`를 넣었는데도 80 BPM 그리드가 잡혔다.

### title / alley

`title`은 city 확정 후, `alley`는 city 결과물을 듣고 무엇을 무너뜨릴지 정한 뒤에 작성한다.
특히 `alley`는 새로 뽑지 말고 city를 레퍼런스나 extend로 물려서 변형한다. 주제가 이어져야
"세계의 변질"이 성립한다.

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
| `bgm-city` | `city_the-center-of-the-room.ogg` | Gemini 웹 앱(gemini.google.com)의 Lyria 3 Pro로 생성, Google AI Pro 구독 | **확인 필요** | 불필요 | |
| `sfx-smg-fire` | `smg-fire_synth-dry.wav` | 자체 제작 (`tools/make-gunshot.mjs`) | 해당 없음 | 불필요 | |
| `sfx-shotgun-fire` | `shotgun-fire_laser-large-000.ogg` | Kenney — Sci-Fi Sounds 1.0 | CC0 1.0 | 불필요 (권장) | 〃 |
| `sfx-enemy-hit` | `enemy-hit_impact-metal-medium-004.ogg` | Kenney — Impact Sounds 1.0 | CC0 1.0 | 불필요 (권장) | 〃 |
| `sfx-enemy-down` | `enemy-down_explosion-crunch-000.ogg` | Kenney — Sci-Fi Sounds 1.0 | CC0 1.0 | 불필요 (권장) | 〃 |
| `sfx-player-hit` | `player-hit_impact-punch-medium-001.ogg` | Kenney — Impact Sounds 1.0 | CC0 1.0 | 불필요 (권장) | 〃 |
| `sfx-player-dash` | `player-dash_phase-jump-2.ogg` | Kenney — Digital Audio | CC0 1.0 | 불필요 (권장) | 〃 |
| `sfx-player-death` | `player-death_low-frequency-explosion-001.ogg` | Kenney — Sci-Fi Sounds 1.0 | CC0 1.0 | 불필요 (권장) | 〃 |
| `sfx-room-locked` | `room-locked_impact-metal-004.ogg` | Kenney — Sci-Fi Sounds 1.0 | CC0 1.0 | 불필요 (권장) | 〃 |
| `sfx-room-cleared` | `room-cleared_impact-soft-heavy-000.ogg` | Kenney — Impact Sounds 1.0 | CC0 1.0 | 불필요 (권장) | 〃 |

**SFX는 전부 정리됐다.** 팩 3종의 `License.txt`를 직접 열어 확인했고 셋 다 CC0 1.0이며
개인·교육·상업 이용을 명시적으로 허용한다. 표기는 의무가 아니지만 크레딧에 한 줄
`Sound effects by Kenney (kenney.nl)`를 넣는 편이 낫다. 비용이 없다.

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

> **다만 하나는 8월 8일 전에 확인해야 한다. 해커톤 규정이 제출물 에셋의 소유권이나 권리
> 보유를 요구하는지 여부다.** 요구한다면 AI 생성 BGM이 그 조건을 만족하지 못할 수 있고,
> 이는 약관 문제가 아니라 대회 규정 문제라 우리가 해결할 수 없다. 규정 문서를 확인해
> 이 칸을 채워야 한다.

상업화 이야기가 나오면 그때는 **Vertex AI로 다시 뽑는 것**이 답이다. 곡당 약 $0.08이고
상업 이용이 명시돼 있으며 배상까지 붙는다. 그 시점에는 곡이 어떤 소리여야 하는지 정확히
알고 있으므로 근접시키는 비용도 낮다.

직접 제작한 경우 출처에 `자체 제작`, 라이선스에 `해당 없음`으로 기록한다.

CC0 / CC-BY 여부를 반드시 확인하고, CC-BY면 표기 문구를 타이틀 화면 또는 크레딧에 넣어야 한다.
