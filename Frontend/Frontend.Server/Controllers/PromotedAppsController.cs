using Microsoft.AspNetCore.Mvc;
using PromotedApp = Frontend.Shared.Models.PromotedApp;
using Npgsql;

namespace Frontend.Server.Controllers;

[ApiController]
[Route("[controller]")]
public class PromotedAppsController : ControllerBase
{
  [HttpGet]
  public async Task<List<PromotedApp>> Get()
  {
    List<PromotedApp> apps = new List<PromotedApp>();
    string? connString = Environment.GetEnvironmentVariable("CONNECTION_STRING");
    await using var conn = new NpgsqlConnection(connString);
    await conn.OpenAsync();

    await using (var cmd = new NpgsqlCommand(
      System.IO.File.ReadAllText("./Sql/promoted_apps.pgsql"),
    conn))
    await using (var reader = await cmd.ExecuteReaderAsync())
    {
      while (await reader.ReadAsync())
      {
        apps.Add(new PromotedApp
        {
          AppID = reader.GetInt64(0),
          Name = reader.GetString(1),
          Description = reader.IsDBNull(2) ? null : reader.GetString(2),
          IconURL = reader.GetString(3),
          PageURL = reader.GetString(4),
          RatingAverage = reader.IsDBNull(5) ? null : reader.GetDecimal(5)
        });
      }
    }

    await conn.CloseAsync();

    return apps;
  }
}
