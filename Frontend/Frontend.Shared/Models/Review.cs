namespace Frontend.Shared.Models;

public class Review
{
  public string Ip { get; set; }
  public DateTime Date { get; set; }
  public decimal Rating { get; set; } = 3m;
  public string? Body { get; set; }
}
