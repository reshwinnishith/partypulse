export const PARTY_QUESTIONS = [
  "Who is most likely to laugh at their own jokes?",
  "Who would survive longest in a zombie apocalypse?",
  "Who is most likely to become famous?",
  "Who takes the longest to get ready?",
  "Who would spend all their money on food?",
  "Who is most likely to start a cult?",
  "Who would be the worst roommate?",
  "Who is most likely to go viral for something embarrassing?",
  "Who would win in an argument with a brick wall?",
  "Who secretly has the best dance moves?",
  "Who would eat the weirdest food combination?",
  "Who is most likely to talk to strangers on the internet?",
  "Who would forget their own birthday?",
  "Who is most likely to be late to their own wedding?",
  "Who would binge-watch a show without telling anyone?",
]

export function pickRandomQuestions(count: number = 5): string[] {
  return [...PARTY_QUESTIONS].sort(() => Math.random() - 0.5).slice(0, count)
}
