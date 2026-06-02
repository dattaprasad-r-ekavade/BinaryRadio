const PREFIX = '[SynthReel Export]'

export function logExportError(message, detail) {
  if (detail !== undefined) console.error(PREFIX, message, detail)
  else console.error(PREFIX, message)
}

export function logExportWarn(message, detail) {
  if (detail !== undefined) console.warn(PREFIX, message, detail)
  else console.warn(PREFIX, message)
}

export function logExportInfo(message, detail) {
  if (detail !== undefined) console.info(PREFIX, message, detail)
  else console.info(PREFIX, message)
}
