namespace Frontend.Shared.Models;

public class PromotedApp
{
  public long AppID { get; set; }
  public string Name { get; set; }
  public string? Description { get; set; }
  public string IconURL { get; set; }
  public string PageURL { get; set; }
  public decimal? RatingAverage { get; set; }
}
