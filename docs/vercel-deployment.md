# Vercel 배포

## 프로젝트 연결

Vercel에서 Git 저장소를 가져온 뒤 다음 값을 사용한다.

| 설정 | 값 |
| --- | --- |
| Root Directory | `client` |
| Framework Preset | `Vite` |
| Build Command | `pnpm run build` |
| Output Directory | `dist` |
| Install Command | 자동 감지 |
| Node.js Version | `22.x` |
| Production Branch | `main` |

빌드 명령과 출력 경로는 `client/vercel.json`에도 선언되어 있다. Install
Command는 직접 덮어쓰지 않는다. 저장소 루트의 `packageManager`와
`pnpm-lock.yaml`을 사용해 pnpm 버전과 설치 결과를 고정한다.

현재 클라이언트는 외부 API나 비밀값을 사용하지 않으므로 Vercel 환경변수는
필요하지 않다.

## 배포 흐름

- `main` 이외의 브랜치와 Pull Request는 Preview 배포로 확인한다.
- `main`에 병합된 커밋은 Production 배포로 전환한다.
- GitHub Actions의 CI와 Vercel 빌드는 독립적으로 실행한다.

## SPA rewrite

현재 앱은 `/` 경로 하나만 사용하므로 catch-all rewrite를 설정하지 않는다.
불필요한 rewrite는 존재하지 않는 `/assets/*` 요청까지 `index.html`로
응답하게 만들어 Phaser의 자산 오류를 감출 수 있다.

클라이언트 라우팅을 추가할 때만 Vercel의 Vite SPA rewrite를 검토한다.
