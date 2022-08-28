using Microsoft.AspNetCore.Mvc;
using SearchApp = Frontend.Shared.Models.SearchApp;
using Npgsql;

namespace Frontend.Server.Controllers;

[ApiController]
[Route("[controller]")]
public class SearchController : ControllerBase
{
  [HttpGet]
  public async Task<List<SearchApp>> Get(string s)
  {
    List<SearchApp> apps = new List<SearchApp>();
    string? connString = Environment.GetEnvironmentVariable("CONNECTION_STRING");
    await using var conn = new NpgsqlConnection(connString);
    await conn.OpenAsync();

    await using var cmd = new NpgsqlCommand(
      System.IO.File.ReadAllText("./Sql/search_apps.pgsql"),
    conn)
    {
      Parameters =
      {
          new() { Value = s, NpgsqlDbType = NpgsqlTypes.NpgsqlDbType.Text },
      }
    };
    await using (var reader = await cmd.ExecuteReaderAsync())
    {
      while (await reader.ReadAsync())
      {
        apps.Add(new SearchApp
        {
          Score = reader.GetDouble(0),
          AppID = reader.GetInt64(1),
          Name = reader.GetString(2),
          Description = reader.IsDBNull(3) ? null : reader.GetString(3),
          IconURL = reader.GetString(4),
          RatingAverage = reader.IsDBNull(5) ? null : reader.GetDecimal(5)
        });
      }
    }

    await conn.CloseAsync();

    return apps;
  }
}
