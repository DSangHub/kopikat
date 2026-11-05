require 'json'

package = JSON.parse(File.read(File.join(__dir__, 'package.json')))

Pod::Spec.new do |s|
  s.name = 'KopycatNative'
  s.version = package['version']
  s.summary = package['description']
  s.license = { :type => 'UNLICENSED' }
  s.homepage = 'https://www.kopycat.app'
  s.author = 'KopyCat'
  s.source = { :path => '.' }
  s.source_files = 'ios/Sources/**/*.{swift,h,m}'
  s.ios.deployment_target = '15.0'
  s.dependency 'Capacitor'
  s.swift_version = '5.9'
  s.resource_bundles = { 'KopycatNativePrivacy' => ['ios/Sources/KopycatNative/PrivacyInfo.xcprivacy'] }
end
