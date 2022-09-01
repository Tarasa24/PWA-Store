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

    List<string> keywords = new List<string>();
    await using var cmd1 = new NpgsqlCommand(
      System.IO.File.ReadAllText("./Sql/get_keywords_by_id.pgsql"),
    conn)
    {
      Parameters =
      {
          new() { Value = appID, NpgsqlDbType = NpgsqlTypes.NpgsqlDbType.Integer },
      }
    };
    await using (var reader = await cmd1.ExecuteReaderAsync())
    {
      while (await reader.ReadAsync())
      {
        keywords.Add(reader.GetString(0));
      }
    }


    var rng = new Random();
    await using var cmd2 = new NpgsqlCommand(
      System.IO.File.ReadAllText("./Sql/similar_apps_by_id.pgsql"),
    conn)
    {
      Parameters =
      {
        new() { Value = string.Join("|", keywords.OrderBy(x => rng.Next()).Take(5))  , NpgsqlDbType = NpgsqlTypes.NpgsqlDbType.Text },
        new() { Value = appID, NpgsqlDbType = NpgsqlTypes.NpgsqlDbType.Integer },
      }
    };
    await using (var reader = await cmd2.ExecuteReaderAsync())
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
