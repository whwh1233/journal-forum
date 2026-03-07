/**
 * 前端密码哈希工具
 * 使用 SHA-256 对密码进行哈希，防止明文传输
 */

/**
 * 对密码进行 SHA-256 哈希
 * @param password 用户输入的明文密码
 * @param salt 盐值（使用 email 作为盐，防止彩虹表攻击）
 * @returns 64位十六进制哈希字符串
 */
export async function hashPassword(password: string, salt: string): Promise<string> {
  // 将密码和盐拼接，盐转小写确保一致性
  const data = password + salt.toLowerCase().trim();

  // 使用 Web Crypto API 进行 SHA-256 哈希
  const encoder = new TextEncoder();
  const dataBuffer = encoder.encode(data);
  const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);

  // 转换为十六进制字符串
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

  return hashHex;
}
