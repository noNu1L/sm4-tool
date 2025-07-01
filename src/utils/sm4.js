// SM4 加密解密工具类
// 基于国密 SM4 算法的 JavaScript 实现

class SM4 {
  constructor() {
    // SM4 算法的 S 盒
    this.sbox = [
      0xd6, 0x90, 0xe9, 0xfe, 0xcc, 0xe1, 0x3d, 0xb7, 0x16, 0xb6, 0x14, 0xc2, 0x28, 0xfb, 0x2c, 0x05,
      0x2b, 0x67, 0x9a, 0x76, 0x2a, 0xbe, 0x04, 0xc3, 0xaa, 0x44, 0x13, 0x26, 0x49, 0x86, 0x06, 0x99,
      0x9c, 0x42, 0x50, 0xf4, 0x91, 0xef, 0x98, 0x7a, 0x33, 0x54, 0x0b, 0x43, 0xed, 0xcf, 0xac, 0x62,
      0xe4, 0xb3, 0x1c, 0xa9, 0xc9, 0x08, 0xe8, 0x95, 0x80, 0xdf, 0x94, 0xfa, 0x75, 0x8f, 0x3f, 0xa6,
      0x47, 0x07, 0xa7, 0xfc, 0xf3, 0x73, 0x17, 0xba, 0x83, 0x59, 0x3c, 0x19, 0xe6, 0x85, 0x4f, 0xa8,
      0x68, 0x6b, 0x81, 0xb2, 0x71, 0x64, 0xda, 0x8b, 0xf8, 0xeb, 0x0f, 0x4b, 0x70, 0x56, 0x9d, 0x35,
      0x1e, 0x24, 0x0e, 0x5e, 0x63, 0x58, 0xd1, 0xa2, 0x25, 0x22, 0x7c, 0x3b, 0x01, 0x21, 0x78, 0x87,
      0xd4, 0x00, 0x46, 0x57, 0x9f, 0xd3, 0x27, 0x52, 0x4c, 0x36, 0x02, 0xe7, 0xa0, 0xc4, 0xc8, 0x9e,
      0xea, 0xbf, 0x8a, 0xd2, 0x40, 0xc7, 0x38, 0xb5, 0xa3, 0xf7, 0xf2, 0xce, 0xf9, 0x61, 0x15, 0xa1,
      0xe0, 0xae, 0x5d, 0xa4, 0x9b, 0x34, 0x1a, 0x55, 0xad, 0x93, 0x32, 0x30, 0xf5, 0x8c, 0xb1, 0xe3,
      0x1d, 0xf6, 0xe2, 0x2e, 0x82, 0x66, 0xca, 0x60, 0xc0, 0x29, 0x23, 0xab, 0x0d, 0x53, 0x4e, 0x6f,
      0xd5, 0xdb, 0x37, 0x45, 0xde, 0xfd, 0x8e, 0x2f, 0x03, 0xff, 0x6a, 0x72, 0x6d, 0x6c, 0x5b, 0x51,
      0x8d, 0x1b, 0xaf, 0x92, 0xbb, 0xdd, 0xbc, 0x7f, 0x11, 0xd9, 0x5c, 0x41, 0x1f, 0x10, 0x5a, 0xd8,
      0x0a, 0xc1, 0x31, 0x88, 0xa5, 0xcd, 0x7b, 0xbd, 0x2d, 0x74, 0xd0, 0x12, 0xb8, 0xe5, 0xb4, 0xb0,
      0x89, 0x69, 0x97, 0x4a, 0x0c, 0x96, 0x77, 0x7e, 0x65, 0xb9, 0xf1, 0x09, 0xc5, 0x6e, 0xc6, 0x84,
      0x18, 0xf0, 0x7d, 0xec, 0x3a, 0xdc, 0x4d, 0x20, 0x79, 0xee, 0x5f, 0x3e, 0xd7, 0xcb, 0x39, 0x48
    ];

    // 系统参数 FK
    this.fk = [0xa3b1bac6, 0x56aa3350, 0x677d9197, 0xb27022dc];

    // 固定参数 CK
    this.ck = [
      0x00070e15, 0x1c232a31, 0x383f464d, 0x545b6269,
      0x70777e85, 0x8c939aa1, 0xa8afb6bd, 0xc4cbd2d9,
      0xe0e7eef5, 0xfc030a11, 0x181f262d, 0x343b4249,
      0x50575e65, 0x6c737a81, 0x888f969d, 0xa4abb2b9,
      0xc0c7ced5, 0xdce3eaf1, 0xf8ff060d, 0x141b2229,
      0x30373e45, 0x4c535a61, 0x686f767d, 0x848b9299,
      0xa0a7aeb5, 0xbcc3cad1, 0xd8dfe6ed, 0xf4fb0209,
      0x10171e25, 0x2c333a41, 0x484f565d, 0x646b7279
    ];
  }

  // 字节替换
  sbox_replace(a) {
    return this.sbox[a & 0xff];
  }

  // 线性变换 L
  l_transform(b) {
    return b ^ this.rotateLeft(b, 2) ^ this.rotateLeft(b, 10) ^ this.rotateLeft(b, 18) ^ this.rotateLeft(b, 24);
  }

  // 线性变换 L'
  l_prime_transform(b) {
    return b ^ this.rotateLeft(b, 13) ^ this.rotateLeft(b, 23);
  }

  // 循环左移
  rotateLeft(value, bits) {
    return ((value << bits) | (value >>> (32 - bits))) >>> 0;
  }

  // T 变换
  t_transform(a) {
    const b0 = this.sbox_replace((a >>> 24) & 0xff);
    const b1 = this.sbox_replace((a >>> 16) & 0xff);
    const b2 = this.sbox_replace((a >>> 8) & 0xff);
    const b3 = this.sbox_replace(a & 0xff);
    const b = (b0 << 24) | (b1 << 16) | (b2 << 8) | b3;
    return this.l_transform(b >>> 0);
  }

  // T' 变换
  t_prime_transform(a) {
    const b0 = this.sbox_replace((a >>> 24) & 0xff);
    const b1 = this.sbox_replace((a >>> 16) & 0xff);
    const b2 = this.sbox_replace((a >>> 8) & 0xff);
    const b3 = this.sbox_replace(a & 0xff);
    const b = (b0 << 24) | (b1 << 16) | (b2 << 8) | b3;
    return this.l_prime_transform(b >>> 0);
  }

  // 密钥扩展
  keyExpansion(key) {
    const mk = [];
    for (let i = 0; i < 4; i++) {
      mk[i] = (key[i * 4] << 24) | (key[i * 4 + 1] << 16) | (key[i * 4 + 2] << 8) | key[i * 4 + 3];
      mk[i] = mk[i] >>> 0;
    }

    const k = [];
    for (let i = 0; i < 4; i++) {
      k[i] = mk[i] ^ this.fk[i];
      k[i] = k[i] >>> 0;
    }

    const rk = [];
    for (let i = 0; i < 32; i++) {
      k[i + 4] = k[i] ^ this.t_prime_transform(k[i + 1] ^ k[i + 2] ^ k[i + 3] ^ this.ck[i]);
      k[i + 4] = k[i + 4] >>> 0;
      rk[i] = k[i + 4];
    }

    return rk;
  }

  // SM4 加密一个块
  encryptBlock(input, roundKeys) {
    const x = [];
    for (let i = 0; i < 4; i++) {
      x[i] = (input[i * 4] << 24) | (input[i * 4 + 1] << 16) | (input[i * 4 + 2] << 8) | input[i * 4 + 3];
      x[i] = x[i] >>> 0;
    }

    for (let i = 0; i < 32; i++) {
      x[i + 4] = x[i] ^ this.t_transform(x[i + 1] ^ x[i + 2] ^ x[i + 3] ^ roundKeys[i]);
      x[i + 4] = x[i + 4] >>> 0;
    }

    const output = new Uint8Array(16);
    for (let i = 0; i < 4; i++) {
      const val = x[35 - i];
      output[i * 4] = (val >>> 24) & 0xff;
      output[i * 4 + 1] = (val >>> 16) & 0xff;
      output[i * 4 + 2] = (val >>> 8) & 0xff;
      output[i * 4 + 3] = val & 0xff;
    }

    return output;
  }

  // SM4 解密一个块
  decryptBlock(input, roundKeys) {
    // 解密使用相反顺序的轮密钥
    const reverseRoundKeys = roundKeys.slice().reverse();
    return this.encryptBlock(input, reverseRoundKeys);
  }

  // PKCS7 填充
  pkcs7Padding(data, blockSize) {
    const paddingLength = blockSize - (data.length % blockSize);
    const padding = new Uint8Array(paddingLength).fill(paddingLength);
    const result = new Uint8Array(data.length + paddingLength);
    result.set(data);
    result.set(padding, data.length);
    return result;
  }

  // 移除 PKCS7 填充
  removePkcs7Padding(data) {
    if (data.length === 0) return data;
    const paddingLength = data[data.length - 1];
    if (paddingLength > data.length || paddingLength === 0) {
      throw new Error('Invalid padding');
    }
    return data.slice(0, data.length - paddingLength);
  }

  // 十六进制字符串转字节数组
  hexToBytes(hex) {
    const result = new Uint8Array(hex.length / 2);
    for (let i = 0; i < hex.length; i += 2) {
      result[i / 2] = parseInt(hex.substr(i, 2), 16);
    }
    return result;
  }

  // 字节数组转十六进制字符串
  bytesToHex(bytes) {
    return Array.from(bytes)
      .map(byte => byte.toString(16).padStart(2, '0'))
      .join('');
  }

  // 字符串转字节数组（UTF-8）
  stringToBytes(str) {
    return new TextEncoder().encode(str);
  }

  // 字节数组转字符串（UTF-8）
  bytesToString(bytes) {
    return new TextDecoder().decode(bytes);
  }

  // SM4 ECB 加密
  encryptEcb(hexKey, plainText) {
    try {
      if (!plainText) return plainText;

      const keyBytes = this.hexToBytes(hexKey);
      if (keyBytes.length !== 16) {
        throw new Error('密钥长度必须是 16 字节（32 个十六进制字符）');
      }

      const roundKeys = this.keyExpansion(keyBytes);
      const inputBytes = this.stringToBytes(plainText);
      const paddedInput = this.pkcs7Padding(inputBytes, 16);

      const output = new Uint8Array(paddedInput.length);
      for (let i = 0; i < paddedInput.length; i += 16) {
        const block = paddedInput.slice(i, i + 16);
        const encryptedBlock = this.encryptBlock(block, roundKeys);
        output.set(encryptedBlock, i);
      }

      return this.bytesToHex(output);
    } catch (error) {
      console.error('加密失败:', error);
      return plainText;
    }
  }

  // SM4 ECB 解密
  decryptEcb(hexKey, cipherText) {
    try {
      if (!cipherText) return cipherText;

      const keyBytes = this.hexToBytes(hexKey);
      if (keyBytes.length !== 16) {
        throw new Error('密钥长度必须是 16 字节（32 个十六进制字符）');
      }

      const roundKeys = this.keyExpansion(keyBytes);
      const inputBytes = this.hexToBytes(cipherText);

      if (inputBytes.length % 16 !== 0) {
        throw new Error('密文长度必须是 16 的倍数');
      }

      const output = new Uint8Array(inputBytes.length);
      for (let i = 0; i < inputBytes.length; i += 16) {
        const block = inputBytes.slice(i, i + 16);
        const decryptedBlock = this.decryptBlock(block, roundKeys);
        output.set(decryptedBlock, i);
      }

      const unpaddedOutput = this.removePkcs7Padding(output);
      return this.bytesToString(unpaddedOutput);
    } catch (error) {
      console.error('解密失败:', error);
      return cipherText;
    }
  }
}

// SM4 批处理工具类
export class SM4BatchUtil {
  constructor() {
    this.sm4 = new SM4();
    this.defaultKey = 'cc9368581322479ebf3e79348a2757d9';
  }

  // 加密字符串
  encrypt(str) {
    if (!str) return '';
    
    // 防止多次加密
    if (str !== this.decrypt(str)) {
      return str;
    }
    
    return this.sm4.encryptEcb(this.defaultKey, str);
  }

  // 解密字符串，支持逗号分隔的密文
  decrypt(str) {
    if (!str) return str;
    
    if (str.includes(',')) {
      const parts = str.split(',');
      return parts.map(part => this.sm4.decryptEcb(this.defaultKey, part.trim())).join(',');
    }
    
    return this.sm4.decryptEcb(this.defaultKey, str);
  }

  // 使用自定义密钥加密
  encryptWithKey(hexKey, plainText) {
    return this.sm4.encryptEcb(hexKey, plainText);
  }

  // 使用自定义密钥解密
  decryptWithKey(hexKey, cipherText) {
    return this.sm4.decryptEcb(hexKey, cipherText);
  }

  // 批量处理文本行
  processLines(lines, operation, hexKey = null) {
    const key = hexKey || this.defaultKey;
    return lines.map(line => {
      if (!line.trim()) return line;
      return operation === 'encrypt' 
        ? this.sm4.encryptEcb(key, line)
        : this.sm4.decryptEcb(key, line);
    });
  }
} 