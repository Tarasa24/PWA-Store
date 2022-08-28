namespace Frontend.Shared.Models;

public class PopularApp
{
  public long AppID { get; set; }
  public string Name { get; set; }
  public string? Description { get; set; }
  public string IconURL { get; set; }
  public decimal? RatingAverage { get; set; }
}
