/** 설정용 `//` 구분자를 HUD에서 읽기 쉬운 파이프로 모두 바꿈. */
export const formatStageLabel = (label: string) =>
  label.replace(/\s*\/\/\s*/g, ' | ');
