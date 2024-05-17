export class ByteData {
  public pos: number;
  public bytes: any;
  public startOfMsg: number;

  constructor(c: number) {
    this.pos = 0;
    this.bytes = new Uint8Array(c);
    this.startOfMsg = 0;

  }
  // wrapper functions called by actual web sockets afterwards--

  public markStartOfMsg() {
    this.startOfMsg = this.pos;
    this.pos += 2;
  }
  
  public markEndOfMsg() {
    let len = this.pos - this.startOfMsg - 2;
    this.bytes[0] = (len >> 8) & 255;
    this.bytes[1] = len & 255;
  }

  public clear() {
    this.pos = 0;
  }

  public getPosition() {
    return this.pos;
  }

  public getBytes() {
    return this.bytes;
  }

  public appendByte(d:any) {
    this.bytes[this.pos++] = d;
  }

  public appendByteAtPos(e:any,d:any) {
    this.bytes[e] = d;
  }

  public appendChar(d:any) {
    this.bytes[this.pos++] = d;
  }

  public appendCharAtPos(e:any,d:any) {
    this.bytes[e] = d;
  }

  public appendShort(d:any) {
    this.bytes[this.pos++] = (d >> 8) & 255;
    this.bytes[this.pos++] = d & 255;
  }

  public appendInt(d:any){
    this.bytes[this.pos++] = (d >> 24) & 255;
    this.bytes[this.pos++] = (d >> 16) & 255;
    this.bytes[this.pos++] = (d >> 8) & 255;
    this.bytes[this.pos++] = d & 255;
  }

  public appendLong(d:any){
    this.bytes[this.pos++] = (d >> 56) & 255;
    this.bytes[this.pos++] = (d >> 48) & 255;
    this.bytes[this.pos++] = (d >> 40) & 255;
    this.bytes[this.pos++] = (d >> 32) & 255;
    this.bytes[this.pos++] = (d >> 24) & 255;
    this.bytes[this.pos++] = (d >> 16) & 255;
    this.bytes[this.pos++] = (d >> 8) & 255;
    this.bytes[this.pos++] = d & 255;
  }

  public appendLongAsBigInt(e:any){
    const d = BigInt(e);
    this.bytes[this.pos++] = Number((d >> BigInt(56)) & BigInt(255));
    this.bytes[this.pos++] = Number((d >> BigInt(48)) & BigInt(255));
    this.bytes[this.pos++] = Number((d >> BigInt(40)) & BigInt(255));
    this.bytes[this.pos++] = Number((d >> BigInt(32)) & BigInt(255));
    this.bytes[this.pos++] = Number((d >> BigInt(24)) & BigInt(255));
    this.bytes[this.pos++] = Number((d >> BigInt(16)) & BigInt(255));
    this.bytes[this.pos++] = Number((d >> BigInt(8)) & BigInt(255));
    this.bytes[this.pos++] = Number(d & BigInt(255));
  }


  public appendString(d:any){
    let strLen = d.length;
    for (let i = 0; i < strLen; i++) {
      this.bytes[this.pos++] = d.charCodeAt(i);
    }
  }


//   public appendByteArr(d:any){
//     let byteLen = d.length;
//     for (let i = 0; i < byteLen; i++) {
//       this.bytes[this.pos++] = d[i];
//     }
//   }

  public appendByteArr(e:any , d:any){
    for (let i = 0; i < d; i++) {
        this.bytes[this.pos++] = e[i];
      }
  }

}
