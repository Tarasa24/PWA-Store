using Microsoft.AspNetCore.Mvc;
using Review = Frontend.Shared.Models.Review;
using ReviewPost = Frontend.Shared.Models.ReviewPost;
using Npgsql;

namespace Frontend.Server.Controllers;

[ApiController]
[Route("[controller]")]
public class ReviewsController : ControllerBase
{
  [HttpGet("{appID}")]
  public async Task<List<Review>> Get(long appID, int limit = 5)
  {
    List<Review> apps = new List<Review>();
    string? connString = Environment.GetEnvironmentVariable("CONNECTION_STRING");
    await using var conn = new NpgsqlConnection(connString);
    await conn.OpenAsync();

    await using var cmd = new NpgsqlCommand(
      System.IO.File.ReadAllText("./Sql/review_by_appid.pgsql"),
    conn)
    {
      Parameters =
      {
          new() { Value = appID, NpgsqlDbType = NpgsqlTypes.NpgsqlDbType.Bigint },
          new() { Value = limit, NpgsqlDbType = NpgsqlTypes.NpgsqlDbType.Integer }
      }
    };
    await using (var reader = await cmd.ExecuteReaderAsync())
    {
      while (await reader.ReadAsync())
      {
        apps.Add(new Review
        {
          Ip = reader.GetString(0),
          Date = reader.GetDateTime(1),
          Rating = reader.GetDecimal(2),
          Body = reader.IsDBNull(3) ? null : reader.GetString(3)
        });
      }
    }

    await conn.CloseAsync();

    return apps;
  }

  [HttpPost("{appID}")]
  public async Task Post(long appID, [FromBody] ReviewPost r)
  {
    r.Ip = HttpContext.Connection.RemoteIpAddress?.ToString();

    string? connString = Environment.GetEnvironmentVariable("CONNECTION_STRING");
    await using var conn = new NpgsqlConnection(connString);
    await conn.OpenAsync();

    await using var cmd = new NpgsqlCommand(
      System.IO.File.ReadAllText("./Sql/insert_review.pgsql"),
    conn)
    {
      Parameters =
      {
          new() { Value = appID, NpgsqlDbType = NpgsqlTypes.NpgsqlDbType.Bigint },
          new() { Value = r.Ip, NpgsqlDbType = NpgsqlTypes.NpgsqlDbType.Varchar },
          new() { Value = r.Rating, NpgsqlDbType = NpgsqlTypes.NpgsqlDbType.Numeric },
          new() { Value = r.Body, NpgsqlDbType = NpgsqlTypes.NpgsqlDbType.Varchar }
      }
    };
    await cmd.ExecuteNonQueryAsync();
    await conn.CloseAsync();
  }
}
