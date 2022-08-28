/* eslint-disable */
export interface ManifestObj {
  name: string | undefined
  short_name: string | undefined
  description: string | undefined
  start_url: string
  scope: string | undefined
  display: string
  background_color: string | undefined
  theme_color: string | undefined
  icons: {
    src: string
    type: string
    sizes: string
  }[]
  screenshots:
    | {
        src: string
        type: string
        sizes: string
      }[]
    | undefined
}

export type Class<T = any> = new (...args: any[]) => T;