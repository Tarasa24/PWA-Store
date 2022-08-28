var builder = WebApplication.CreateBuilder(args);

// Add services to the container.

builder.Services.AddControllers();
// Learn more about configuring Swagger/OpenAPI at https://aka.ms/aspnetcore/swashbuckle
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(options =>
{
  options.SupportNonNullableReferenceTypes();
});

builder.Services.AddCors(options =>
{
  options.AddPolicy(name: "AllowClient",
  policy =>
  {
    policy.WithOrigins(
      builder.Environment.IsDevelopment() 
        ? "http://localhost:5113"
        : Environment.GetEnvironmentVariable("CLIENT_URL")
      ).AllowAnyHeader().AllowAnyMethod();
  });
});

var app = builder.Build();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
  app.UseSwagger();
  app.UseSwaggerUI();
  app.UseCors("AllowClient");
}

app.MapControllers();

app.Run();
