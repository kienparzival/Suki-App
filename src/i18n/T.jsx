import { useLang } from './LangContext'

export default function T({ k, vars }) {
  const { t } = useLang()
  return t(k, vars)
}
