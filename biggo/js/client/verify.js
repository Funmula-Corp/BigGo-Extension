export default function verifyMessage(data) {
  if(!data || (data && !data.source)) {
    return false
  }

  if(data.source !== "_biggo_") {
    return false
  }

  if(!data.type) {
    return false
  }

  return true
}