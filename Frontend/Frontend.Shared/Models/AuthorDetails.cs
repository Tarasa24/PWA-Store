namespace Frontend.Shared.Models;

public class AuthorDetails
{
  public string Name { get; set; }
  public decimal? RatingAverage { get; set; }
  public long RatingTotal { get; set; }
  public PopularApp[] Apps { get; set; }
}
