using Microsoft.AspNetCore.Mvc;
using PopularApp = Frontend.Shared.Models.PopularApp;
using Npgsql;

namespace Frontend.Server.Controllers;

[ApiController]
[Route("[controller]")]
public class PopularAppsController : ControllerBase
{
  [HttpGet]
  public async Task<List<PopularApp>> Get()
  {
    List<PopularApp> apps = new List<PopularApp>();
    string? connString = Environment.GetEnvironmentVariable("CONNECTION_STRING");
    await using var conn = new NpgsqlConnection(connString);
    await conn.OpenAsync();

    await using (var cmd = new NpgsqlCommand(
      System.IO.File.ReadAllText("./Sql/popular_apps.pgsql"),
    conn))
    await using (var reader = await cmd.ExecuteReaderAsync())
    {
      while (await reader.ReadAsync())
      {
        apps.Add(new PopularApp
        {
          AppID = reader.GetInt64(0),
          Name = reader.GetString(1),
          Description = reader.IsDBNull(2) ? null : reader.GetString(2),
          IconURL = reader.GetString(3),
          RatingAverage = reader.IsDBNull(4) ? null : reader.GetDecimal(4)
        });
      }
    }

    await conn.CloseAsync();

    return apps;
  }
}
