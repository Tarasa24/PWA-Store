using Microsoft.AspNetCore.Mvc;
using Frontend.Shared.Models;
using Npgsql;

namespace Frontend.Server.Controllers;

[ApiController]
[Route("[controller]")]
public class AuthorController : ControllerBase
{
  [HttpGet("{authorID}")]
  public async Task<AuthorDetails> Get(long authorID)
  {
    string? connString = Environment.GetEnvironmentVariable("CONNECTION_STRING");
    await using var conn = new NpgsqlConnection(connString);
    await conn.OpenAsync();

    await using var cmd = new NpgsqlCommand(
      System.IO.File.ReadAllText("./Sql/author_by_id.pgsql"),
    conn)
    {
      Parameters =
      {
          new() { Value = authorID, NpgsqlDbType = NpgsqlTypes.NpgsqlDbType.Integer },
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
        return new AuthorDetails
        {
          Name = reader.GetString(0),
          RatingAverage = reader.IsDBNull(1) ? null : reader.GetDecimal(1),
          RatingTotal = reader.GetInt64(2),
          Apps = await GetAuthorsApps(authorID)
        };
      }
    }

    return null;
  }

  private async Task<PopularApp[]> GetAuthorsApps(long authorID)
  {
    string? connString = Environment.GetEnvironmentVariable("CONNECTION_STRING");
    await using var conn = new NpgsqlConnection(connString);
    await conn.OpenAsync();

    await using var cmd = new NpgsqlCommand(
      System.IO.File.ReadAllText("./Sql/author_apps.pgsql"),
    conn)
    {
      Parameters =
      {
          new() { Value = authorID, NpgsqlDbType = NpgsqlTypes.NpgsqlDbType.Integer },
      }
    };
    await using (var reader = await cmd.ExecuteReaderAsync())
    {
      if (!reader.HasRows)
      {
        return null;
      }

      var apps = new List<PopularApp>();
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
      return apps.ToArray();
    }
  }
}
