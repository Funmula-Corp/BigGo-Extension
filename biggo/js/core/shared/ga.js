import { envCall } from "./env"
import ga from "@background/ga"
import { send } from "@/content/messenger"

export default async function(label, action, desc) {
  return await envCall({
    content() {
      send("util", "ga", {label, action, desc})
    },
    background() {
      ga(label, action, desc)
    }
  })
}