using Microsoft.AspNetCore.Components.Web;
using Microsoft.AspNetCore.Components.WebAssembly.Hosting;
using Frontend.Client;

var builder = WebAssemblyHostBuilder.CreateDefault(args);
builder.RootComponents.Add<App>("#app");
builder.RootComponents.Add<HeadOutlet>("head::after");

builder.Services.AddScoped(sp => new HttpClient
{
  BaseAddress = new Uri(
    builder.HostEnvironment.IsDevelopment()
      ? "http://localhost:5186"
      : Environment.GetEnvironmentVariable("SERVER_URL")
  )
});

await builder.Build().RunAsync();
