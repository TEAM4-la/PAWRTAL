using System.Security.Cryptography;
using System.Text;

namespace PawrtalWeb.Shared
{
    public class Utilities
    {
        private static readonly byte[] Key = Encoding.UTF8.GetBytes("p@wrtaL!K3y#2026p@wrtaL!K3y#2026"); // 32 bytes for AES-256
        private static readonly byte[] IV  = Encoding.UTF8.GetBytes("p@wrtaL!1V#2026!"); // 16 bytes

        public static string Encrypt(string plainText)
        {
            using var aes = Aes.Create();
            aes.Key = Key;
            aes.IV = IV;

            using var encryptor = aes.CreateEncryptor();
            byte[] plainBytes = Encoding.UTF8.GetBytes(plainText);
            byte[] cipherBytes = encryptor.TransformFinalBlock(plainBytes, 0, plainBytes.Length);

            return Convert.ToBase64String(cipherBytes);
        }

        public static string Decrypt(string cipherText)
        {
            using var aes = Aes.Create();
            aes.Key = Key;
            aes.IV = IV;

            using var decryptor = aes.CreateDecryptor();
            byte[] cipherBytes = Convert.FromBase64String(cipherText);
            byte[] plainBytes = decryptor.TransformFinalBlock(cipherBytes, 0, cipherBytes.Length);

            return Encoding.UTF8.GetString(plainBytes);
        }
    }
}
