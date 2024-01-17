export function formatDateToIsoString(utcDate: Date): string {
  const yeat = utcDate.getUTCFullYear()
  const month = (utcDate.getMonth() + 1).toString().padStart(2, '0')
  const day = utcDate.getUTCDate().toString().padStart(2, '0')
  const hour = utcDate.getUTCHours().toString().padStart(2, '0')
  const minutes = utcDate.getUTCMinutes().toString().padStart(2, '0')
  const seconds = utcDate.getUTCSeconds().toString().padStart(2, '0')

  return `${yeat}-${month}-${day} ${hour}:${minutes}:${seconds}`
}

export function groupDateAndTime(date: string, hours: string): Date {
  const [hour, minute] = hours.split(':')

  if (!hour || !minute) {
    throw new Error('invlid hours')
  }

  const mealDateFormated = new Date(date)
  mealDateFormated.setUTCHours(Number(hour))
  mealDateFormated.setUTCMinutes(Number(minute))
  return mealDateFormated
}
