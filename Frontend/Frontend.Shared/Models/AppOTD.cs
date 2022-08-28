namespace Frontend.Shared.Models;

public class AppOTD
{
  public DateTime Date { get; set; }
  public long AppID { get; set; }
  public string Name { get; set; }
  public string? Description { get; set; }
  public string PageURL { get; set; }
  public string IconURL { get; set; }
  public string? ColorBg { get; set; }
  public string? ColorTheme { get; set; }
}
