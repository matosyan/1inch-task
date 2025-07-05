export class ReqObjectHelper {
  static setLocalsReqOrRes(reqOrRes: any, keyValues: Record<string, any>) {
    if (reqOrRes.locals) {
      for (const [key, value] of Object.entries(keyValues)) {
        reqOrRes.locals[key] = value;
      }
    } else {
      reqOrRes.locals = keyValues;
    }
  }
}
