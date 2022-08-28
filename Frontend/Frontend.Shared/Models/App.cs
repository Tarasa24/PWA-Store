namespace Frontend.Shared.Models;

public class App
{
  public string Name { get; set; }
  public string? Description { get; set; }
  public string? Lang { get; set; }
  public long? AuthorID { get; set; }
  public string? AuthorName { get; set; }
  public string PageURL { get; set; }
  public long ByteSize { get; set; }
  public string IconURL { get; set; }
  public string[]? Screenshots { get; set; }
  public string? ColorBg { get; set; }
  public string? ColorTheme { get; set; }
  public decimal? RatingAverage { get; set; }
  public long RatingTotal { get; set; }
}
