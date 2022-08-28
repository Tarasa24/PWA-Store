using Microsoft.AspNetCore.Mvc;
using Frontend.Shared.Models;
using Npgsql;

namespace Frontend.Server.Controllers;

[ApiController]
[Route("[controller]")]
public class AppDetailController : ControllerBase
{
  [HttpGet("{appID}")]
  public async Task<App> Get(long appID)
  {
    string? connString = Environment.GetEnvironmentVariable("CONNECTION_STRING");
    await using var conn = new NpgsqlConnection(connString);
    await conn.OpenAsync();

    await using var cmd = new NpgsqlCommand(
      System.IO.File.ReadAllText("./Sql/app_detail_by_id.pgsql"),
    conn)
    {
      Parameters =
      {
          new() { Value = appID, NpgsqlDbType = NpgsqlTypes.NpgsqlDbType.Integer },
      }
    };
    await using (var reader = await cmd.ExecuteReaderAsync())
    {
      if (!reader.HasRows)
      {
        return null;
      }

      while (await reader.ReadAsync())
      {
        return new App
        {
          Name = reader.GetString(0),
          Description = reader.IsDBNull(1) ? null : reader.GetString(1),
          Lang = reader.IsDBNull(2) ? null : reader.GetString(2),
          AuthorID = reader.IsDBNull(3) ? null : reader.GetInt64(3),
          AuthorName = reader.IsDBNull(4) ? null : reader.GetString(4),
          PageURL = reader.GetString(5),
          ByteSize = reader.GetInt64(6),
          IconURL = reader.GetString(7),
          Screenshots = reader.IsDBNull(8) ? null : reader.GetString(8).Split(','),
          ColorBg = reader.IsDBNull(9) ? null : reader.GetString(9),
          ColorTheme = reader.IsDBNull(10) ? null : reader.GetString(10),
          RatingAverage = reader.IsDBNull(11) ? null : reader.GetDecimal(11),
          RatingTotal = reader.GetInt64(12),
        };
      }
    }

    return null;
  }
}
