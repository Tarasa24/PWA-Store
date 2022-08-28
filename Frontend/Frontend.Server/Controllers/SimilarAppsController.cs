using Microsoft.AspNetCore.Mvc;
using Frontend.Shared.Models;
using Npgsql;

namespace Frontend.Server.Controllers;

[ApiController]
[Route("[controller]")]
public class SimilarAppsController : ControllerBase
{
  [HttpGet("{appID}")]
  public async Task<List<SimilarApp>> Get(long appID)
  {
    List<SimilarApp> apps = new List<SimilarApp>();
    string? connString = Environment.GetEnvironmentVariable("CONNECTION_STRING");
    await using var conn = new NpgsqlConnection(connString);
    await conn.OpenAsync();

    await using var cmd = new NpgsqlCommand(
      System.IO.File.ReadAllText("./Sql/similar_apps_by_id.pgsql"),
    conn)
    {
      Parameters =
      {
          new() { Value = appID, NpgsqlDbType = NpgsqlTypes.NpgsqlDbType.Integer },
      }
    };
    await using (var reader = await cmd.ExecuteReaderAsync())
    {
      while (await reader.ReadAsync())
      {
        apps.Add(new SimilarApp
        {
          Score = reader.GetFloat(0),
          AppID = reader.GetInt64(1),
          Name = reader.GetString(2),
          IconURL = reader.GetString(3),
        });
      }
    }

    await conn.CloseAsync();

    return apps;
  }
}
