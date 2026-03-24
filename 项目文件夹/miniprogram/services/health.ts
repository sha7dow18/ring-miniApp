import { healthMock } from "../mock/health"

export function getHealthPageData() {
  return Promise.resolve(healthMock)
}
