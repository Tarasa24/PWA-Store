namespace Frontend.Client.Shared;

using SHA1 = System.Security.Cryptography.SHA1;
using System.Drawing;
using System.Text;

public static class HelperFunctions
{
  public static string Hash(string input)
  {
    using var sha1 = SHA1.Create();
    return Convert.ToHexString(sha1.ComputeHash(Encoding.UTF8.GetBytes(input))).ToLower();
  }
  
  public static string ContrastColor(string hexColor)
  {
    try {
      var c = ColorTranslator.FromHtml(hexColor);
      var yiq = ((c.R * 299) + (c.G * 587) + (c.B * 114)) / 1000;
      return (yiq >= 128) ? "black" : "white";
    } catch (Exception) {
      return "black";
    }
  }
}
