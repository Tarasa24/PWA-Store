namespace Frontend.Shared.Models;

public class ReviewPost
{
  public string? Ip { get; set; }
  public decimal Rating { get; set; } = 3m;
  public string? Body { get; set; }
}
