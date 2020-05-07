// Create a fake email service
interface EmailServiceProps {
  destinationEmail: string
  subject: string
  nomProjet: string
  invitationLink: string
}
const callsToEmailStub: Array<EmailServiceProps> = []
const resetEmailStub = () => {
  while (callsToEmailStub.length) callsToEmailStub.shift()
}
const sendEmailInvitation = async (args: EmailServiceProps) => {
  callsToEmailStub.push(args)
}
const getCallsToEmailStub = () => {
  return callsToEmailStub
}

export { resetEmailStub, sendEmailInvitation, getCallsToEmailStub }
