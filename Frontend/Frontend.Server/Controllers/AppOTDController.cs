using Microsoft.AspNetCore.Mvc;
using Frontend.Shared.Models;
using Npgsql;

namespace Frontend.Server.Controllers;

[ApiController]
[Route("[controller]")]
public class AppOTDController : ControllerBase
{
  [HttpGet()]
  public async Task<AppOTD> Get()
  {
    string? connString = Environment.GetEnvironmentVariable("CONNECTION_STRING");
    await using var conn = new NpgsqlConnection(connString);
    await conn.OpenAsync();

    await using (var cmd = new NpgsqlCommand(
      System.IO.File.ReadAllText("./Sql/app_otd.pgsql"),
    conn))
    await using (var reader = await cmd.ExecuteReaderAsync())
    {
      if (!reader.HasRows)
      {
        return null;
      }

      while (await reader.ReadAsync())
      {
        return new AppOTD
        {
          Date = reader.GetDateTime(0),
          AppID = reader.GetInt64(1),
          Name = reader.GetString(2),
          Description = reader.IsDBNull(3) ? null : reader.GetString(3),
          PageURL = reader.GetString(4),
          IconURL = reader.GetString(5),
          ColorBg = reader.IsDBNull(6) ? null : reader.GetString(6),
          ColorTheme = reader.IsDBNull(7) ? null : reader.GetString(7),
        };
      }
    }

    return null;
  }
}
